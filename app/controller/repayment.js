const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const MODELS = require("../models");
const Model = MODELS.repaymenthistory;
const approvalsModel = MODELS.approvals;


exports.list = function (req, res) {
    Model.findAll({
        order: [
            ['updatedAt', 'DESC']
        ]
    }).then(function (entries) {
        res.send(entries || null)
    });
}

exports.create = async function (req, res) {
    try {
        const repaymenthistoryrec = await Model.create(req.body);
        const obj = {
            type: 'Repayment',
            status: 0,
            repaymenthistory_id: repaymenthistoryrec.id,
            profile_id: req.body.profile_id,
            maker_id: req.body.maker_id
        };
        await approvalsModel.create(obj);
        res.send(req.body);
    } catch (err) {
        res.status(500).send(err);
    }
}