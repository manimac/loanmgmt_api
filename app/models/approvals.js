const approvalsModel = (sequelize, Sequelize) => {
    const approvals = sequelize.define('approvals', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        type: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.INTEGER, defaultValue: 0 }
    })

    return approvals
}

module.exports = approvalsModel