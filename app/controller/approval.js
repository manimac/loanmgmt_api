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
const depositModel = MODELS.deposit;
const deposithistoryModel = MODELS.deposithistory;
var request = require('request');


exports.filterlist = async function (req, res) {
    try {
        let where = {};
        if (req.body.fromdate) {
            req.body.fromdate = req.body.fromdate + " 00:00:00";
        }
        if (req.body.todate) {
            req.body.todate = req.body.todate + " 23:59:59";
        }
        if (req.body.loan) {
            where.loan_id = req.body.loan;
        }
        if (req.body.mobile) {
            where['$maker.mobile$'] = { [Op.startsWith]: req.body.mobile };
        }
        where['createdAt'] = {
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
                }, profilehistoryModel, loanhistoryModel, loanModel, investmentModel, repaymenthistoryModel, deposithistoryModel]
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
            }, profilehistoryModel, loanhistoryModel, loanModel, investmentModel, repaymenthistoryModel, 
            {
                model: deposithistoryModel,
                as: 'deposithistory',
                include: [depositModel]
            }]
        });
        res.send(entries || null);
    } catch (err) {
        res.status(500).send(err);
    }
};

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

function formatnormalDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [day, month, year].join('-');
}


exports.update = async function (req, res) {
    try {

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


                    const profileDetails = await profileModel.findOne({
                        where: {
                            id: loanHistoryResult.profile_id,
                        }
                    });
                    if (profileDetails) {
                        var headers = {
                            'Content-Type': 'application/json'
                        }
                        var options = {
                            url: `http://www.smsintegra.com/api/smsapi.aspx?uid=madrastech&pwd=24225&mobile=` + profileDetails.mobile + `&msg=Dear%20Cust,%20Rs.` + loanHistoryResult.disbursed + `%20on%20` + formatnormalDate(loanHistoryResult.createdAt) + `%20New%20loan%20disbursed%20under%20Loan%20No:` + loanHistoryResult.loan_id + `.%20http://madrastechnologies.com/portfolios%20-%20Madras%20Gold%20-Madras%20Technologies&sid=MADTEC&type=0&dtTimeNow=xxxxx&entityid=1601370168033895617&tempid=1607100000000258364`,
                            method: 'POST',
                            headers: headers
                        }
                        await request(options)
                    }

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

                    const profileDetails = await profileModel.findOne({
                        where: {
                            id: investmentResult.profile_id,
                        }
                    });
                    if (profileDetails) {
                        var headers = {
                            'Content-Type': 'application/json'
                        }
                        if (investmentResult.type == 'Purchase') {
                            var options = {
                                url: `http://www.smsintegra.com/api/smsapi.aspx?uid=madrastech&pwd=24225&mobile=` + profileDetails.mobile + `&msg=Dear%20Cust,%20Rs.` + investmentResult.value + `%20on%20` + formatnormalDate(investmentResult.createdAt) + `%20deposited%20for%20your%20investment,%20http://madrastechnologies.com/portfolios%20-%20Madras%20Gold%20-Madras%20Technologies&sid=MADTEC&type=0&dtTimeNow=xxxxx&entityid=1601370168033895617&tempid=1607100000000258360`,
                                method: 'POST',
                                headers: headers
                            }
                            await request(options)
                        }
                        else if (investmentResult.type == 'Redeem') {
                            var options = {
                                url: `http://www.smsintegra.com/api/smsapi.aspx?uid=madrastech&pwd=24225&mobile=` + profileDetails.mobile + `&msg=Dear%20Cust,%20Rs.` + investmentResult.value + `%20on%20` + formatnormalDate(investmentResult.createdAt) + `%20withdrawn%20from%20your%20investment,%20http://madrastechnologies.com/portfolios%20-%20Madras%20Gold%20-Madras%20Technologies&sid=MADTEC&type=0&dtTimeNow=xxxxx&entityid=1601370168033895617&tempid=1607100000000258361`,
                                method: 'POST',
                                headers: headers
                            }
                            await request(options)
                        }

                    }
                }
                break;
            case 'withdraw':
            case 'deposit':
                const depositResult = await depositModel.findByPk(req.body.deposit_id);
                const depositHistoryResult = await deposithistoryModel.findOne({
                    where: {
                        id: req.body.deposithistory_id,
                    }
                });
                const paymentDepositDetails2 = await paymentModel.findOne({
                    where: {
                        type: depositHistoryResult.paymenttype,
                    }
                });
                if (req.body.status == 2 && (depositHistoryResult.type == 'withdraw') && (!paymentDepositDetails2 || (Number(paymentDepositDetails2.value) < Number(depositHistoryResult.value)))) {
                    res.status(500).send({ message: 'Amount is not available' });
                    return;
                }
                
                await depositHistoryResult.update({ status: req.body.status });
                if(req.body.status == 2 && (depositHistoryResult.type == 'withdraw')){
                    await depositResult.update({ status: 3 });
                }
                else if(depositResult.status != 2){
                    await depositResult.update({ status: req.body.status });
                }
                else if(req.body.status == 2){
                    let value = Number(depositResult.value) + Number(depositHistoryResult.value)
                    await depositResult.update({ value: value });
                }
                
                if (req.body.status == 2) {
                    let paymentValue2 = 0;
                    if (paymentDepositDetails2 && paymentDepositDetails2.value) {
                        if (depositHistoryResult.type == 'deposit') {
                            paymentValue2 = Number(paymentDepositDetails2.value) + Number(depositHistoryResult.value);
                        }
                        else {
                            paymentValue2 = Number(paymentDepositDetails2.value) - Number(depositHistoryResult.value);
                        }
                    }
                    await paymentModel.update({ value: paymentValue2 }, { where: { type: depositHistoryResult.paymenttype } });
                    await paymenthistoryModel.create({ type: depositHistoryResult.paymenttype, value: paymentValue2 });

                    const profileDetails = await profileModel.findOne({
                        where: {
                            id: depositResult.profile_id,
                        }
                    });
                    if (profileDetails) {
                        var headers = {
                            'Content-Type': 'application/json'
                        }
                        if (depositHistoryResult.type == 'deposit') {

                            var options = {

                                url: `http://www.smsintegra.com/api/smsapi.aspx?uid=madrastech&pwd=24225&mobile=` + profileDetails.mobile + `&msg=Dear%20Cust,%20Rs.` + depositHistoryResult.value + `/-%20Deposited%20on%20` + formatnormalDate(depositHistoryResult.createdAt) + `%20in%20Dep%20No-` + depositResult.id + `,%20Instl-` + depositHistoryResult.value + `%20.%20http://madrastechnologies.com/portfolios%20-Madras%20Gold%20-Madras%20Technologies&sid=MADTEC&type=0&dtTimeNow=xxxxx&entityid=1601370168033895617&tempid=1607100000000296956`,
                                method: 'POST',
                                headers: headers
                            }
                            await request(options)
                        }
                        else if (depositHistoryResult.type.toLowerCase() == 'withdraw') {

                            var options = {
                                url: `http://www.smsintegra.com/api/smsapi.aspx?uid=madrastech&pwd=24225&mobile=` + profileDetails.mobile + `&msg=Dear%20Cust,%20Rs.` + depositHistoryResult.value + `/-%20settled%20on%20` + formatnormalDate(depositHistoryResult.createdAt) + `%20from%20Dep%20No-` + depositResult.id + `.%20http://madrastechnologies.com/portfolios%20-%20Madras%20Gold%20-Madras%20Technologies&sid=MADTEC&type=0&dtTimeNow=xxxxx&entityid=1601370168033895617&tempid=1607100000000296957`,
                                method: 'POST',
                                headers: headers
                            }
                            await request(options)
                        }

                    }
                }
                break;
            case 'Repayment':
                const repaymentResult = await repaymenthistoryModel.findByPk(req.body.repaymenthistory_id);
                let renewaldateee = formatDate(repaymentResult.createdAt);
                const paymentDetails3 = await paymentModel.findOne({
                    where: {
                        type: repaymentResult.paymenttype,
                    }
                });
                await repaymentResult.update({ status: req.body.status });
                console.log(renewaldateee)
                if (req.body.status === 2 && (repaymentResult.close == 1)) {
                    const loanResult = await loanModel.findByPk(req.body.repaymenthistory.loan_id);
                    await loanResult.update({ status: 3, principle: repaymentResult.principle, renewaldate: renewaldateee });
                }
                else if (req.body.status === 2) {
                    const loanResult = await loanModel.findByPk(req.body.repaymenthistory.loan_id);
                    await loanResult.update({ status: req.body.status, principle: repaymentResult.principle, renewaldate: renewaldateee });
                }
                if (req.body.status == 2) {
                    let paymentValue3 = 0;
                    if (paymentDetails3 && paymentDetails3.value) {
                        paymentValue3 = Number(paymentDetails3.value) + Number(repaymentResult.amount);
                    }
                    await paymentModel.update({ value: paymentValue3 }, { where: { type: repaymentResult.paymenttype } });
                    await paymenthistoryModel.create({ type: repaymentResult.paymenttype, value: paymentValue3 });
                    const profileDetails = await profileModel.findOne({
                        where: {
                            id: repaymentResult.profile_id,
                        }
                    });
                    if (profileDetails) {
                        var headers = {
                            'Content-Type': 'application/json'
                        }
                        var options = {
                            url: `http://www.smsintegra.com/api/smsapi.aspx?uid=madrastech&pwd=24225&mobile=` + profileDetails.mobile + `&msg=Dear%20Cust,%20Rs.` + repaymentResult.amount + `%20on%20` + formatnormalDate(repaymentResult.createdAt) + `%20received%20against%20Loan%20No:` + repaymentResult.loan_id + `.%20http://madrastechnologies.com/portfolios%20-%20Madras%20Gold%20-Madras%20Technologies&sid=MADTEC&type=0&dtTimeNow=xxxxx&entityid=1601370168033895617&tempid=1607100000000258365`,
                            method: 'POST',
                            headers: headers
                        }
                        await request(options)
                    }
                }
                break;
            default:
                break;
        }
        const result = await Model.findByPk(req.body.id);
        const resp = await result.update(req.body);

        res.send(resp);
    } catch (err) {
        res.status(500).send(err);
    }
};

async function calculateInterest(activeLoansInterest) {
    for (var i = 0; i < activeLoansInterest.length; i++) {
        activeLoansInterest[i].dataValues['interestAmount'] = ((Number(activeLoansInterest[i].principle) * (Number(activeLoansInterest[i].rateofinterest) / 100)) / 365) * Number(activeLoansInterest[i].dataValues.days_between);
        activeLoansInterest[i].dataValues['interestAmount'] = Number(activeLoansInterest[i].dataValues['interestAmount']) + Number(activeLoansInterest[i].principle);
        if (activeLoansInterest[i].dataValues['interestAmount']) {
            activeLoansInterest[i].dataValues['interestAmount'] = Number(activeLoansInterest[i].dataValues['interestAmount']).toFixed(2)
        }
    }
    return activeLoansInterest;
}

async function overdueSend(loans) {
    for (var i = 0; i < loans.length; i++) {
        var headers = {
            'Content-Type': 'application/json'
        }
        var options = {
            url: `http://www.smsintegra.com/api/smsapi.aspx?uid=madrastech&pwd=24225&mobile=` + loans[i].mobile + `&msg=Final%20Notice-%20Dear%20Cust,%20Rs.` + loans[i].dataValues['interestAmount'] + `%20due%20against%20Loan%20No:` + loans[i].id + `.%20To%20stop%20further%20action%20pls%20pay%20the%20interest%20atleast%20for%20renewal.%20http://madrastechnologies.com/portfolios%20-%20Madras%20Gold%20-Madras%20Technologies&sid=MADTEC&type=0&dtTimeNow=xxxxx&entityid=1601370168033895617&tempid=1607100000000258367`,
            method: 'POST',
            headers: headers
        }
        await request(options)
    }
    return loans;
}

async function dueSend(loans) {
    for (var i = 0; i < loans.length; i++) {
        var headers = {
            'Content-Type': 'application/json'
        }
        var options = {
            url: `http://www.smsintegra.com/api/smsapi.aspx?uid=madrastech&pwd=24225&mobile=` + loans[i].mobile + `&msg=Due%20Notice-%20Dear%20Cust,%20Rs.` + loans[i].dataValues['interestAmount'] + `%20due%20against%20Loan%20No:` + loans[i].id + `.%20To%20stop%20further%20action%20pls%20pay%20the%20interest%20atleast%20for%20renewal.%20http://madrastechnologies.com/portfolios%20-%20Madras%20Gold%20-Madras%20Technologies&sid=MADTEC&type=0&dtTimeNow=xxxxx&entityid=1601370168033895617&tempid=1607100000000258366`,
            method: 'POST',
            headers: headers
        }
        await request(options)
    }
    return loans;
}

exports.eventDueOverdue = async function (req, res) {
    const overdueLoans = await loanModel.findAll({
        attributes: [
            [
                Sequelize.literal(
                    `DATEDIFF(CURDATE(), renewaldate)`
                ),
                'days_between'
            ],
            'mobile', 'id',
            'principle',
            'rateofinterest'
        ],
        where: {
            status: 2,
            renewaldate: {
                [Op.not]: null,
            }
        },
        having: Sequelize.literal('days_between > 180')
    });
    const dueLoans = await loanModel.findAll({
        attributes: [
            [
                Sequelize.literal(
                    `DATEDIFF(CURDATE(), renewaldate)`
                ),
                'days_between'
            ],
            'mobile', 'id',
            'principle',
            'rateofinterest'
        ],
        where: {
            status: 2,
            renewaldate: {
                [Op.not]: null,
            }
        },
        having: Sequelize.literal('days_between > 150 AND days_between < 180')
    });
    const loansdaysbetween = await loanModel.findAll({
        attributes: [
            [
                Sequelize.literal(
                    `DATEDIFF(CURDATE(), renewaldate)`
                ),
                'days_between'
            ],
            'mobile', 'id',
            'principle',
            'rateofinterest'
        ],
        where: {
            status: 2,
            renewaldate: {
                [Op.not]: null,
            }
        }
    });
    // let overdueLoansMobile = overdueLoans.map(a => a.mobile);
    // overdueLoansMobile = overdueLoansMobile.join(',');
    // let dueLoansMobile = dueLoans.map(a => a.mobile);
    // dueLoansMobile = dueLoansMobile.join(',');

    const overdueInterest = await calculateInterest(overdueLoans);
    const dueInterest = await calculateInterest(dueLoans);

    await overdueSend(overdueInterest);
    await dueSend(dueInterest);

    res.send({ overdueLoans, dueLoans, overdueInterest, dueInterest, loansdaysbetween });
}