const deposithistoryModel = (sequelize, Sequelize) => {
    const deposithistory = sequelize.define('deposithistory', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        value: { type: Sequelize.TEXT, allowNull: true },
        type: { type: Sequelize.TEXT, allowNull: true },
        paymenttype: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.INTEGER, defaultValue: 0 }
    })

    return deposithistory
}

module.exports = deposithistoryModel