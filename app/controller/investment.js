const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const MODELS = require("../models");
const Model = MODELS.investment;
const approvalsModel = MODELS.approvals;

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
        // if(req.body.type == 'Redeem'){
        //     const isUnitsAvailable = await Model.findOne({
        //         where: {
        //             type: 'Purchase'
        //         },
        //         attributes: [
        //             [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("units"), 'integer')), "totalunits"],
        //         ]
        //     });
        //     console.log(isUnitsAvailable)
        // }
        const investmentRec = await Model.create(req.body);
        const obj = {
            type: 'Investment',
            status: 0,
            investment_id: investmentRec.id,
            profile_id: req.body.profile_id,
            maker_id: req.body.maker_id,
        };
        await approvalsModel.create(obj);
        res.send(req.body);
    } catch (err) {
        res.status(500).send(err);
    }
};