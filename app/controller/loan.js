const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const MODELS = require("../models");
const Model = MODELS.loan;
const loanhistoryModel = MODELS.loanhistory;
const approvalsModel = MODELS.approvals;
const profileModel = MODELS.profile;


exports.list = async function (req, res) {
    try {
        const entries = await Model.findAll({
            order: [['updatedAt', 'DESC']],
            include: [profileModel]
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.filterlist = async function (req, res) {
    try {
        let where = {};
        if(req.body.mobile){
            where.mobile = {
                [Op.startsWith]: req.body.mobile
            }
        }
        if(req.body.status){
            where.status = req.body.status;
        }
        const entries = await Model.findAll({
            where: where,
            order: [['updatedAt', 'DESC']],
            include: [profileModel]
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.pendinglist = function (req, res) {
    Model.findAll({
        where: { 'status': 0 }, // filter by pending loans only
        order: [
            ['updatedAt', 'DESC']
        ]
    }).then(function (entries) {
        res.send(entries || null)
    });
}

exports.create = function (req, res) {
    var loan = req.body;
    loan.status = 0;
    Model.create(loan).then(function (rec) {
        loan.loan_id = rec.id;
        loanhistoryModel.create(loan).then(function (loanhistoryrec) {
            let obj = {
                type: 'Loan',
                status: 0,
                loanhistory_id: loanhistoryrec.id,
                loan_id: loan.loan_id,
                profile_id: req.body.profile_id,
                maker_id: req.body.maker_id,
            }
            approvalsModel.create(obj).then(function () {
                res.send(loan);
            }, function (err) {
                res.status(500).send(err);
            })
        }, function (err) {
            res.status(500).send(err);
        })
    }, function (err) {
        res.status(500).send(err);
    })
}

exports.update = async function (req, res) {
    try {
        const { id: loanId, ...loanHistoryData } = req.body;
        const loanHistoryRec = await loanhistoryModel.create(loanHistoryData);
        const approvalsData = {
            type: 'Loan',
            status: 0,
            loanhistory_id: loanHistoryRec.id,
            loan_id: loanId,
            profile_id: req.body.profile_id,
            maker_id: req.body.maker_id
        };
        await approvalsModel.create(approvalsData);
        res.send(req.body);
    } catch (err) {
        res.status(500).send(err);
    }
};


exports.delete = async function (req, res) {
    try {
        const result = await Model.findByPk(req.params.id);
        await result.update({ status: 4 });
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
};
