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

async function calculateInterest(activeLoansInterest) {
    let interestAmount = 0;
    for (const element of activeLoansInterest) {
        element.interestAmount = ((Number(element.principle) * (Number(element.rateofinterest) / 100)) / 365) * Number(element.dataValues.days_between);
        interestAmount = interestAmount + element.interestAmount;
    }
    return interestAmount ? interestAmount.toFixed(2) : interestAmount;
}

async function calculatePriniciple(activeLoansInterest) {
    let PrinicipleAmount = 0;
    for (const element of activeLoansInterest) {
        PrinicipleAmount = PrinicipleAmount + (Number(element.principle));
    }
    return PrinicipleAmount ? PrinicipleAmount.toFixed(2) : PrinicipleAmount;
}

async function calculateInvestmentsGroup(investments) {
    let arr = [];
    for (var i = 0; i < investments.length; i++) {
        let findExistUser = arr.find(el=>(el.profile_id==investments[i].profile_id))
        if(findExistUser){
            for (var j = 0; j < arr.length; j++) {
                if(arr[j].profile_id == investments[i].profile_id){
                    if(investments[i].type == 'Purchase'){
                        arr[j].value = Number(findExistUser.value) + Number(investments[i].value)
                    }
                    else if(investments[i].type == 'Redeem'){
                        arr[j].value = Number(findExistUser.value) - Number(investments[i].value)
                    }
                }                
            }            
        }
        else{
            arr.push({profile_id: investments[i].profile_id, value: Number(investments[i].value)})
        }
    }
    arr = arr.filter(el=>(el.value!=0))
    return arr;
}

exports.list = async function (req, res) {
    try {
        if (req.body.fromdate) {
            req.body.fromdate = req.body.fromdate + " 00:00:00";
        }
        if (req.body.todate) {
            req.body.todate = req.body.todate + " 23:59:59";
        }
        const newLoans = await loanhistoryModel.findAll({
            where: {
                status: 2,
                createdAt: {
                    [Op.between]: [req.body.fromdate, req.body.todate]
                }
            },
            attributes: [
                [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("disbursed"), 'integer')), "totaldisbursed"],
                [Sequelize.fn("COUNT", Sequelize.col("id")), "totalcount"]
            ]
        });
        const loanRepayments = await repaymenthistoryModel.findAll({
            where: {
                status: 2,
                createdAt: {
                    [Op.between]: [req.body.fromdate, req.body.todate]
                }
            },
            attributes: [
                [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("amount"), 'integer')), "totalamount"],
                [Sequelize.fn("COUNT", Sequelize.col("id")), "totalcount"]
            ]
        });
        const unitsPurchased = await investmentModel.findAll({
            where: {
                status: 2,
                type: 'Purchase',
                createdAt: {
                    [Op.between]: [req.body.fromdate, req.body.todate]
                }
            },
            attributes: [
                [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("value"), 'integer')), "totalvalue"],
                [Sequelize.fn("COUNT", Sequelize.col("id")), "totalcount"]
            ]
        });
        const unitsRedeemed = await investmentModel.findAll({
            where: {
                status: 2,
                type: 'Redeem',
                createdAt: {
                    [Op.between]: [req.body.fromdate, req.body.todate]
                }
            },
            attributes: [
                [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("value"), 'integer')), "totalvalue"],
                [Sequelize.fn("COUNT", Sequelize.col("id")), "totalcount"]
            ]
        });
        const activeLoans = await loanModel.findAll({
            where: {
                status: 2
            },
            attributes: [
                [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("disbursed"), 'integer')), "totaldisbursed"],
                [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("principle"), 'integer')), "totalprinciple"],
                [Sequelize.fn("COUNT", Sequelize.col("id")), "totalcount"]
            ]
        });
        const activeLoansInterest = await loanModel.findAll({
            attributes: [
                [
                    Sequelize.literal(
                        `DATEDIFF(CURDATE(), renewaldate)`
                    ),
                    'days_between'
                ],
                'principle',
                'rateofinterest'
            ],
            where: {
                status: 2,
                renewaldate: {
                    [Op.not]: null,
                }
            },
            having: Sequelize.literal('days_between > 0')
        });

        const cash = await paymentModel.findOne({
            where: {
                type: 'Cash'
            }
        });
        const bank = await paymentModel.findOne({
            where: {
                type: 'Bank'
            }
        });
        const overdueLoans = await loanModel.findAll({
            attributes: [
                [
                    Sequelize.literal(
                        `DATEDIFF(CURDATE(), renewaldate)`
                    ),
                    'days_between'
                ]
            ],
            where: {
                status: 2,
                renewaldate: {
                    [Op.not]: null,
                }
            },
            having: Sequelize.literal('days_between > 180')
        });

        // const overdueLoansprinciple = await loanModel.findAll({
        //     attributes: [
        //         [
        //             Sequelize.literal(
        //                 `DATEDIFF(CURDATE(), renewaldate)`
        //             ),
        //             'days_between'
        //         ],
        //         'principle',
        //         [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("principle"), 'integer')), "totalprinciple"],
        //     ],
        //     where: {
        //         status: 2,
        //         renewaldate: {
        //             [Op.not]: null,
        //         }
        //     },
        //     having: Sequelize.literal('days_between > 180')
        // });

        const overdueLoansInterest = await loanModel.findAll({
            attributes: [
                [
                    Sequelize.literal(
                        `DATEDIFF(CURDATE(), renewaldate)`
                    ),
                    'days_between'
                ],
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


        const investments = await investmentModel.findAll({
            where: {
                status: 2
            },
            // group: ['profile_id'],
        })


        const PurchaseUnitsCnt = await investmentModel.findAll({
            where: {
                status: 2,
                type: 'Purchase'
            },
            attributes: [
                [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("units"), 'double')), "total"]
            ]
        });
        const RedeemUnitsCnt = await investmentModel.findAll({
            where: {
                status: 2,
                type: 'Redeem'
            },
            attributes: [
                [Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("units"), 'double')), "total"]
            ]
        });


        let units = (PurchaseUnitsCnt && PurchaseUnitsCnt[0].dataValues && RedeemUnitsCnt && RedeemUnitsCnt[0].dataValues) ? (PurchaseUnitsCnt[0].dataValues.total - RedeemUnitsCnt[0].dataValues.total) : 0;
        // const units = await investmentModel.sum('units')
        const activeInterest = await calculateInterest(activeLoansInterest);
        let activeLoanAmount = 0;
        let noOfActiveLoan = 0;
        if (activeLoans && Array.isArray(activeLoans) && activeLoans.length > 0) {
            activeLoanAmount = activeLoans[0].dataValues.totalprinciple;
            noOfActiveLoan = activeLoans[0].dataValues.totalcount;
        }
        let totalLoanInterest = Number(activeLoanAmount) + Number(activeInterest);
        let cashValue = cash ? Number(cash.value) : 0;
        let bankValue = bank ? Number(bank.value) : 0;
        let netAsset = Number(totalLoanInterest) + Number(cashValue) + Number(bankValue);



        const overdueInterest = await calculateInterest(overdueLoansInterest);
        let overdueLoanPrinciple = await calculatePriniciple(overdueLoansInterest);
        // if(overdueLoansprinciple && Array.isArray(overdueLoansprinciple) && overdueLoansprinciple.length>0){
        //     overdueLoanPrinciple = overdueLoansprinciple[0].dataValues.totalprinciple;
        // }
        let totaloverdueAmount = Number(overdueInterest) + Number(overdueLoanPrinciple);

        let newLoansTrans = 0;
        let newLoansAmount = 0;
        if (newLoans && Array.isArray(newLoans) && newLoans.length > 0) {
            newLoansTrans = newLoans[0].dataValues.totalcount;
            newLoansAmount = newLoans[0].dataValues.totaldisbursed;
        }
        let loanRepaymentsTrans = 0;
        let loanRepaymentsAmount = 0;
        if (loanRepayments && Array.isArray(loanRepayments) && loanRepayments.length > 0) {
            loanRepaymentsTrans = loanRepayments[0].dataValues.totalcount;
            loanRepaymentsAmount = loanRepayments[0].dataValues.totalamount;
        }
        let unitPurchasedTrans = 0;
        let unitPurchasedAmount = 0;
        if (unitsPurchased && Array.isArray(unitsPurchased) && unitsPurchased.length > 0) {
            unitPurchasedTrans = unitsPurchased[0].dataValues.totalcount;
            unitPurchasedAmount = unitsPurchased[0].dataValues.totalvalue;
        }
        let unitRedeemedTrans = 0;
        let unitRedeemedAmount = 0;
        if (unitsRedeemed && Array.isArray(unitsRedeemed) && unitsRedeemed.length > 0) {
            unitRedeemedTrans = unitsRedeemed[0].dataValues.totalcount;
            unitRedeemedAmount = unitsRedeemed[0].dataValues.totalvalue;
        }

        if (netAsset) {
            netAsset = parseFloat(netAsset).toFixed(2);
        }
        if (totalLoanInterest) {
            totalLoanInterest = parseFloat(totalLoanInterest).toFixed(2);
        }

        let unitrate = parseFloat(Number(netAsset) / Number(units)).toFixed(4);
        if (unitrate) {
            unitrate = parseFloat(unitrate).toFixed(4);
        }
        if (units) {
            units = parseFloat(units).toFixed(4);
        }

        let investmentsGroup = await calculateInvestmentsGroup(investments);

        res.send({ newLoansTrans: newLoansTrans, newLoansAmount: newLoansAmount, loanRepaymentsTrans: loanRepaymentsTrans, loanRepaymentsAmount: loanRepaymentsAmount, unitPurchasedTrans: unitPurchasedTrans, unitPurchasedAmount: unitPurchasedAmount, unitRedeemedTrans: unitRedeemedTrans, unitRedeemedAmount: unitRedeemedAmount, activeLoan: noOfActiveLoan, activeLoanAmount: activeLoanAmount, activeLoanInterest: activeInterest, totalLoanInterest: totalLoanInterest, cash: cashValue, bank: bankValue, netAsset: netAsset, noOfOverdue: overdueLoans.length, overduePrinciple: overdueLoanPrinciple, overdueInterest: overdueInterest, totalOverdue: totaloverdueAmount, noOfInvestments: investmentsGroup.length, noOfUnits: units, unitRate: unitrate });
    } catch (err) {
        res.status(500).send(err);
    }
};