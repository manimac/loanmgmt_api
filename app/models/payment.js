const paymentModel = (sequelize, Sequelize) => {
    const payment = sequelize.define('payment', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        type: { type: Sequelize.STRING, allowNull: true },
        value: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.INTEGER, defaultValue: 1 }
    })

    return payment
}

module.exports = paymentModel