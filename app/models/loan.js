const LoanModel = (sequelize, Sequelize) => {
    const Loan = sequelize.define('Loan', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        mobile: { type: Sequelize.STRING, allowNull: true },
        date: { type: Sequelize.STRING, allowNull: true },
        disbursed: { type: Sequelize.STRING, allowNull: true },
        description: { type: Sequelize.TEXT, allowNull: true },
        principle: { type: Sequelize.STRING, allowNull: true },
        remarks: { type: Sequelize.TEXT, allowNull: true },
        renewaldate: { type: Sequelize.STRING, allowNull: true },
        rateofinterest: { type: Sequelize.STRING, allowNull: true },
        paymenttype: { type: Sequelize.TEXT, allowNull: true },
        loantype: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.INTEGER, defaultValue: 0 }
    })

    return Loan
}

module.exports = LoanModel