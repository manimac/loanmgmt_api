const paymenthistoryModel = (sequelize, Sequelize) => {
    const paymenthistory = sequelize.define('paymenthistory', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        type: { type: Sequelize.STRING, allowNull: true },
        value: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.INTEGER, defaultValue: 1 }
    })

    return paymenthistory
}

module.exports = paymenthistoryModel