const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const MODELS = require("../models");
const Model = MODELS.pricehistory;

exports.list = async function (req, res) {
    try {
        const entries = await Model.findAll({
            order: [['date', 'DESC']],
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.chart = async function (req, res) {
    try {
        let where = {};
        if(req.body.year){
            where.date = {
                [Op.lt]: Sequelize.literal("NOW()"),
                [Op.gte]: Sequelize.literal("DATE_SUB(NOW(), INTERVAL " + req.body.year + " YEAR)")
            };
        }        
        const entries = await Model.findAll({
            order: [['date', 'ASC']],
            where: where
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.create = async function (req, res) {
    try {
        const isExist = await Model.findOne({
            where: {
                date: req.body.date,
            },
        });
        if(isExist){
            res.status(500).send({ message: 'Date already exists' });
            return;
        }
        let tt = await Model.create(req.body);
        res.send(req.body);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.delete = function (req, res) {
    Model.findByPk(req.params.id).then(function (result) {
        result.destroy().then((resp) => {
            res.send(resp);
        })
    }, function (err) {
        res.status(500).send(err);
    })
}

exports.update = async function (req, res) {
    try {
        const isExist = await Model.findOne({
            where: {
                date: req.body.date,
            },
        });
        if(isExist && (isExist.id != req.body.id)){
            res.status(500).send({ message: 'Date already exists' });
            return;
        }
        const result = await Model.findByPk(req.body.id);
        const resp = await result.update(req.body);
        res.send(resp);
    } catch (err) {
        res.status(500).send(err);
    }
};