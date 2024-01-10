const depositModel = (sequelize, Sequelize) => {
    const deposit = sequelize.define('deposit', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        purpose: { type: Sequelize.STRING, allowNull: true },
        type: { type: Sequelize.STRING, allowNull: true },
        deposittype: { type: Sequelize.STRING, allowNull: true },
        beneficiaryname: { type: Sequelize.STRING, allowNull: true },
        value: { type: Sequelize.TEXT, allowNull: true },
        tenure: { type: Sequelize.TEXT, allowNull: true },
        paymenttype: { type: Sequelize.TEXT, allowNull: true },
        description: { type: Sequelize.TEXT, allowNull: true },
        paymenttype: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.INTEGER, defaultValue: 0 }
    })

    return deposit
}

module.exports = depositModel