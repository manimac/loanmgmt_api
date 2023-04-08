const pricehistoryModel = (sequelize, Sequelize) => {
    const pricehistory = sequelize.define('pricehistory', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        date: { type: Sequelize.STRING, allowNull: true },
        value: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.INTEGER, defaultValue: 1 }
    })

    return pricehistory
}

module.exports = pricehistoryModel