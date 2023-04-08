const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const MODELS = require("../models");
const Model = MODELS.payment;
const paymenthistoryModel = MODELS.paymenthistory;

exports.list = async function (req, res) {
    try {
        const entries = await Model.findAll({
            order: [['updatedAt', 'DESC']],
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.create = async function (req, res) {
    try {
        await Model.create(req.body);
        res.send(req.body);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.update = async function (req, res) {
    try {
        await Model.update({ value: req.body.cash }, { where: { type: 'cash' } });
        await Model.update({ value: req.body.bank }, { where: { type: 'bank' } });
        await paymenthistoryModel.create({type: req.body.type, value: req.body.value});
        res.send(req.body);
    } catch (err) {
        res.status(500).send(err);
    }
};