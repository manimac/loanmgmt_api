const investmentModel = (sequelize, Sequelize) => {
    const investment = sequelize.define('investment', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        units: { type: Sequelize.STRING, allowNull: true },
        type: { type: Sequelize.STRING, allowNull: true },
        value: { type: Sequelize.STRING, allowNull: true },
        rate: { type: Sequelize.STRING, allowNull: true },
        paymenttype: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.INTEGER, defaultValue: 0 }
    })

    return investment
}

module.exports = investmentModel