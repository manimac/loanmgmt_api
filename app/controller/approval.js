const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const MODELS = require("../models");
const Model = MODELS.approvals;
const profileModel = MODELS.profile;
const profilehistoryModel = MODELS.profilehistory;
const loanModel = MODELS.loan;
const loanhistoryModel = MODELS.loanhistory;
const investmentModel = MODELS.investment;
const repaymenthistoryModel = MODELS.repaymenthistory;
const paymentModel = MODELS.payment;
const paymenthistoryModel = MODELS.paymenthistory;


exports.filterlist = async function (req, res) {
    try {
        let where = {};
        if(req.body.fromdate){
            req.body.fromdate = req.body.fromdate + " 00:00:00";
        }
        if(req.body.todate){
            req.body.todate = req.body.todate + " 23:59:59";
        }
        where['updatedAt'] = {
            [Op.between]: [req.body.fromdate, req.body.todate]
        }
        const entries = await Model.findAll({
            where,
            order: [['updatedAt', 'DESC']],
            include: [
                {
                    model: profileModel,
                    as: 'profile'
                },
                {
                    model: profileModel,
                    as: 'maker'
                },
                {
                    model: profileModel,
                    as: 'checker'
                }, profilehistoryModel, loanhistoryModel, loanModel, investmentModel, repaymenthistoryModel]
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.list = async function (req, res) {
    try {
        const entries = await Model.findAll({
            order: [['updatedAt', 'DESC']],
            include: [
                {
                    model: profileModel,
                    as: 'profile'
                },
                {
                    model: profileModel,
                    as: 'maker'
                },
                {
                    model: profileModel,
                    as: 'checker'
                }, profilehistoryModel, loanhistoryModel, loanModel, investmentModel, repaymenthistoryModel]
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};

exports.pendinglist = async function (req, res) {
    try {
        const entries = await Model.findAll({
            where: { status: [0] },
            order: [['updatedAt', 'DESC']],
            include: [{
                model: profileModel,
                as: 'profile'
            }, profilehistoryModel, loanhistoryModel, loanModel, investmentModel, repaymenthistoryModel]
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};


exports.update = async function (req, res) {
    try {
        const result = await Model.findByPk(req.body.id);
        const resp = await result.update(req.body);

        switch (req.body.type) {
            case 'Profile':
                const profileHistoryResult = await profilehistoryModel.findByPk(req.body.profilehistory_id);
                await profileHistoryResult.update({ status: req.body.status });

                if (req.body.status === 2) {
                    const profileResult = await profileModel.findByPk(req.body.profile_id);
                    await profileResult.update(profileHistoryResult.dataValues);
                }
                break;
            case 'Loan':
                const loanHistoryResult = await loanhistoryModel.findByPk(req.body.loanhistory_id);
                const paymentDetails = await paymentModel.findOne({
                    where: {
                        type: loanHistoryResult.paymenttype,
                    }
                });
                if (req.body.status == 2 && (!paymentDetails || (Number(paymentDetails.value) < Number(loanHistoryResult.disbursed)))) {
                    res.status(500).send({ message: 'Amount is not available' });
                    return;
                }
                await loanHistoryResult.update({ status: req.body.status });
                const loanResult = await loanModel.findByPk(req.body.loan_id);
                await loanResult.update({ status: req.body.status });
                if (req.body.status == 2) {
                    let paymentValue = 0;
                    if (paymentDetails && paymentDetails.value) {
                        paymentValue = Number(paymentDetails.value) - Number(loanHistoryResult.disbursed);
                    }
                    await paymentModel.update({ value: paymentValue }, { where: { type: loanHistoryResult.paymenttype } });
                    await paymenthistoryModel.create({ type: loanHistoryResult.paymenttype, value: paymentValue });
                }
                break;
            case 'Investment':
                const investmentResult = await investmentModel.findByPk(req.body.investment_id);
                const paymentDetails2 = await paymentModel.findOne({
                    where: {
                        type: investmentResult.paymenttype,
                    }
                });
                if (req.body.status == 2 && (investmentResult.type == 'Redeem') && (!paymentDetails2 || (Number(paymentDetails2.value) < Number(investmentResult.value)))) {
                    res.status(500).send({ message: 'Amount is not available' });
                    return;
                }
                await investmentResult.update({ status: req.body.status });
                if (req.body.status == 2) {
                    let paymentValue2 = 0;
                    if (paymentDetails2 && paymentDetails2.value) {
                        if (investmentResult.type == 'Purchase') {
                            paymentValue2 = Number(paymentDetails2.value) + Number(investmentResult.value);
                        }
                        else {
                            paymentValue2 = Number(paymentDetails2.value) - Number(investmentResult.value);
                        }
                    }
                    await paymentModel.update({ value: paymentValue2 }, { where: { type: investmentResult.paymenttype } });
                    await paymenthistoryModel.create({ type: investmentResult.paymenttype, value: paymentValue2 });
                }
                break;
            case 'Repayment':
                const repaymentResult = await repaymenthistoryModel.findByPk(req.body.repaymenthistory_id);
                const paymentDetails3 = await paymentModel.findOne({
                    where: {
                        type: repaymentResult.paymenttype,
                    }
                });
                await repaymentResult.update({ status: req.body.status });
                if (req.body.status === 2 && (repaymentResult.close == 1)) {
                    const loanResult = await loanModel.findByPk(req.body.repaymenthistory.loan_id);
                    await loanResult.update({ status: 3, principle: repaymentResult.principle });
                }
                else if (req.body.status === 2) {
                    const loanResult = await loanModel.findByPk(req.body.repaymenthistory.loan_id);
                    await loanResult.update({ status: req.body.status, principle: repaymentResult.principle });
                }
                if (req.body.status == 2) {
                    let paymentValue3 = 0;
                    if (paymentDetails3 && paymentDetails3.value) {
                        paymentValue3 = Number(paymentDetails3.value) + Number(repaymentResult.amount);
                    }
                    await paymentModel.update({ value: paymentValue3 }, { where: { type: repaymentResult.paymenttype } });
                    await paymenthistoryModel.create({ type: repaymentResult.paymenttype, value: paymentValue3 });
                }
                break;
            default:
                break;
        }

        res.send(resp);
    } catch (err) {
        res.status(500).send(err);
    }
};