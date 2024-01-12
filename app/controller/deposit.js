const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const MODELS = require("../models");
const Model = MODELS.deposit;
const approvalsModel = MODELS.approvals;
const profileModel = MODELS.profile;
const deposithistoryModel = MODELS.deposithistory;

exports.list = async function (req, res) {
    try {
        var where = {};
        if (req.body.mobile) {
            where['$Profile.mobile$'] = { [Op.startsWith]: req.body.mobile };
        }
        if (req.body.beneficiaryname) {
            where['beneficiaryname'] = { [Op.startsWith]: req.body.beneficiaryname };
        }
        if (req.body.status) {
            where['status'] = req.body.status;
        }
        const entries = await Model.findAll({
            order: [['updatedAt', 'DESC']],
            where,
            include: [{
                    model: profileModel,
                    as: 'profile',
                    association: 'Profile'
                }, deposithistoryModel]
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.create = async function (req, res) {
    try {
        const depositRec = await Model.create(req.body);        
        const obj = {
            value: req.body.value,
            type: 'deposit',
            paymenttype: req.body.paymenttype,
            status: 0,
            profile_id: req.body.profile_id,
            maker_id: req.body.maker_id,
            units: req.body.units,
            rate: req.body.rate,
            deposit_id: depositRec.id,
        };
        const depositthistoryRec = await deposithistoryModel.create(obj);
        const obj2 = {
            type: 'deposit',
            status: 0,
            deposit_id: depositRec.id,
            profile_id: req.body.profile_id,
            maker_id: req.body.maker_id,
            deposithistory_id: depositthistoryRec.id,
        };
        await approvalsModel.create(obj2);
        res.send(req.body);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.deposithistorycreate = async function (req, res) {
    try {
        const depositthistoryRec = await deposithistoryModel.create(req.body);
        const obj2 = {
            type: req.body.type,
            status: 0,
            deposit_id: req.body.deposit_id,
            profile_id: req.body.profile_id,
            maker_id: req.body.maker_id,
            deposithistory_id: depositthistoryRec.id,
        };
        await approvalsModel.create(obj2);
        res.send(req.body);
    } catch (err) {
        res.status(500).send(err);
    }
};