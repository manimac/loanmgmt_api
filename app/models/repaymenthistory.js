const repaymenthistoryModel = (sequelize, Sequelize) => {
    const repaymenthistory = sequelize.define('repaymenthistory', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        amount: { type: Sequelize.STRING, allowNull: true },
        principle: { type: Sequelize.STRING, allowNull: true },
        close: { type: Sequelize.STRING, allowNull: true },
        paymenttype: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.INTEGER, defaultValue: 0 }
    })

    return repaymenthistory
}

module.exports = repaymenthistoryModel