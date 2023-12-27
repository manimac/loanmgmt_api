const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const MODELS = require("../models");
const Model = MODELS.profile;
const profilehistoryModel = MODELS.profilehistory;
const approvalsModel = MODELS.approvals;
const loanModel = MODELS.loan;
const investmentModel = MODELS.investment;
const repaymenthistoryModel = MODELS.repaymenthistory;
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const async = require('async');
var request = require('request');



exports.list = function (req, res) {
    Model.findAll({
        order: [
            ['updatedAt', 'DESC']
        ]
    }).then(function (entries) {
        res.send(entries || null)
    });
}

exports.filterlist = async function (req, res) {
    const where = {};
    if (req.body.mobile) where.mobile = { [Op.startsWith]: req.body.mobile };
    if (req.body.status) where.status = req.body.status;
    if (req.body.payout) where.nomineemobile = req.body.payout;
    // Model.findAll({
    //     where,
    //     order: [
    //         ['updatedAt', 'DESC']
    //     ]
    // }).then(function (entries) {
    //     res.send(entries || null)
    // });
    const entries = await Model.findAll({
        where,
        order: [
            ['updatedAt', 'DESC']
        ]
    });

    const investment = await investmentModel.findAll({
        order: [['updatedAt', 'DESC']]
    });

    const mobiles = await Model.findAll({
        order: [
            ['updatedAt', 'DESC']
        ]
    });
    res.send({ entries: entries, investment: investment, mobiles: mobiles });
}

exports.isMobileExist = async function (req, res) {
    const { mobile, id } = req.body;
    const where = id ? { mobile, id: { [Op.not]: id } } : { mobile };
    const isMobileExist = await Model.findOne({ where });
    if (isMobileExist) {
        res.status(500).send({ message: 'Mobile number exists' });
    } else {
        res.send({ message: 'success' });
    }
}

// SET STORAGE
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var dir = './public/uploads/profile';
        fs.mkdirSync(dir, { recursive: true }); // create directory if it doesn't exist
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Append the extension
    }
});

exports.create = async function (req, res) {
    var upload = multer({ storage: storage }).single('image');
    upload(req, res, async function (err) {
        if (err) {
            return res.status(500).send(err);
        }
        req.body.image = res.req.file && res.req.file.filename || ''; 
        req.body.status = 2;

        try {
            await Model.create(req.body);
            const lastrecord = await Model.findOne({order: [['updatedAt', 'DESC']],})
            const profileId = lastrecord.id;
            req.body.profile_id = profileId;

            await profilehistoryModel.create(req.body);
            const lastprofilehistoryrec = await profilehistoryModel.findOne({order: [['updatedAt', 'DESC']],})

            const obj = {
                type: 'Profile',
                status: 2,
                profilehistory_id: lastprofilehistoryrec.id,
                profile_id: profileId,
                maker_id: req.body.maker_id
            };

            await approvalsModel.create(obj);
            res.send(req.body);            
        } catch (err) {
            res.status(500).send(err);
        }
    });
};


exports.update = function (req, res) {
    var upload = multer({ storage: storage }).single('image');
    upload(req, res, async function (err) {
        var profileId = req.body.id;
        req.body.image = res.req.file && res.req.file.filename || req.body.image;
        req.body['profile_id'] = profileId;
        delete req.body.id;
        try {
            const profileResult = await Model.findByPk(req.body.profile_id);
            await profileResult.update(req.body);
            profilehistoryModel.create(req.body).then(function(profilehistoryrec) {
                const obj = {
                    type: 'Profile',
                    status: 2,
                    profilehistory_id: profilehistoryrec.id,
                    profile_id: profileId,
                    maker_id: req.body.maker_id
                };
                approvalsModel.create(obj).then(function() {
                    res.send(req.body);
                }, function(err) {
                    res.status(500).send(err);
                })
            }, function(err) {
                res.status(500).send(err);
            })


            // const profilehistoryrec = await profilehistoryModel.create(req.body);
            // const obj = {
            //     type: 'Profile',
            //     status: 0,
            //     profilehistory_id: profilehistoryrec.id,
            //     profile_id: profileId,
            //     maker_id: req.body.maker_id
            // };
            // await approvalsModel.create(obj);
            // res.send(req.body);
        } catch (err) {
            res.status(500).send(err);
        }
    });
}


exports.delete = function (req, res) {
    Model.findByPk(req.params.id).then(function (result) {
        result.destroy().then((resp) => {
            res.send(resp);
        })
    }, function (err) {
        res.status(500).send(err);
    })
}

exports.login = async function (req, res) {
    const isMobileExist = await Model.findOne({
        where: {
            mobile: req.body.mobile,
        },
    });

    if (!isMobileExist) {
        res.status(500).send({ message: 'Mobile number not exists' });
        return;
    }

    if (isMobileExist.status == 0) {
        res.status(500).send({ message: 'Your profile is not yet approved.' });
        return;
    }

    if (isMobileExist.status == 1) {
        res.status(500).send({ message: 'Your profile is declined.' });
        return;
    }

    let otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        await Model.update({ otp }, { where: { id: isMobileExist.id } });
        var headers = {
            'Content-Type': 'application/json'
        }
        var options = {
            url: `http://www.smsintegra.com/api/smsapi.aspx?uid=madrastech&pwd=24225&mobile=` + isMobileExist.mobile + `&msg=Dear%20` + isMobileExist.name + `,%20Your%20one%20time%20password%20is%20` + otp + `%20-%20Madras%20Gold%20-Madras%20Technologies&sid=MADTEC&type=0&dtTimeNow=xxxxx&entityid=1601370168033895617&tempid=1607100000000258359`,
            method: 'POST',
            headers: headers
        }
        await request(options)
        res.send({msg: "Success"})
        // res.send(otp);
    } catch (err) {
        res.status(500).send(err);
    }
};


exports.loginwithotp = async function (req, res) {
    const user = await Model.findOne({ where: { mobile: req.body.mobile } });
    if (!user) return res.status(500).send({ message: 'Mobile number not exists' });
    if (user.status == 0) return res.status(500).send({ message: 'Your profile is not yet approved.' });
    if (user.status == 1) return res.status(500).send({ message: 'Your profile is declined.' });

    const isMobileOTPExist = await Model.findOne({
        where: { mobile: req.body.mobile, otp: req.body.otp }
    });
    if (isMobileOTPExist) {
        res.send(isMobileOTPExist);
    } else {
        res.status(500).send({ message: 'Please enter a valid otp' });
    }
}

exports.search = async function (req, res) {
    const where = {
        mobile: req.body.mobile,
        ...(req.body.role !== 'Admin' && {role: 'Client'})
    };
    const isMobileExist = await Model.findOne({ where });
    if (isMobileExist) {
        const loans = await loanModel.findAll({
            where: { mobile: req.body.mobile },
            order: [['updatedAt', 'DESC']]
        });
        const investment = await investmentModel.findAll({
            where: { profile_id: isMobileExist.id },
            order: [['updatedAt', 'DESC']]
        });
        const repayment = await repaymenthistoryModel.findAll({
            where: { profile_id: isMobileExist.id },
            order: [['updatedAt', 'DESC']]
        });
        res.send({ loans, profile: isMobileExist, investment, repayment });
    } else {
        res.status(500).send({ message: 'Mobile number not exists' });
    }
}
