const dbConfig = require("../../config/db").config;

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    operatorsAliases: '1',
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.profile = require("./profile")(sequelize, Sequelize);
db.loan = require("./loan")(sequelize, Sequelize);
db.investment = require("./investment")(sequelize, Sequelize);
db.loanhistory = require("./loanhistory")(sequelize, Sequelize);
db.repaymenthistory = require("./repaymenthistory")(sequelize, Sequelize);
db.profilehistory = require("./profilehistory")(sequelize, Sequelize);
db.approvals = require("./approvals")(sequelize, Sequelize);
db.payment = require("./payment")(sequelize, Sequelize);
db.paymenthistory = require("./paymenthistory")(sequelize, Sequelize);
db.pricehistory = require("./pricehistory")(sequelize, Sequelize);
db.deposit = require("./deposit")(sequelize, Sequelize);
db.deposithistory = require("./deposithistory")(sequelize, Sequelize);



/** relationship */
db.loan.belongsTo(db.profile, { foreignKey: 'profile_id', targetKey: 'id' });
db.investment.belongsTo(db.profile, { foreignKey: 'profile_id', targetKey: 'id' });
db.deposit.belongsTo(db.profile, { foreignKey: 'profile_id', targetKey: 'id' });
db.deposithistory.belongsTo(db.deposit, { foreignKey: 'deposit_id', targetKey: 'id' });
db.deposithistory.belongsTo(db.profile, { foreignKey: 'profile_id', targetKey: 'id' });
db.loanhistory.belongsTo(db.profile, { foreignKey: 'profile_id', targetKey: 'id' });
db.loanhistory.belongsTo(db.loan, { foreignKey: 'loan_id', targetKey: 'id' });
db.repaymenthistory.belongsTo(db.profile, { foreignKey: 'profile_id', targetKey: 'id' });
db.repaymenthistory.belongsTo(db.loan, { foreignKey: 'loan_id', targetKey: 'id' });
db.profilehistory.belongsTo(db.profile, { foreignKey: 'profile_id', targetKey: 'id' });
db.approvals.belongsTo(db.profile, { foreignKey: 'profile_id', targetKey: 'id', as: 'profile' });
db.approvals.belongsTo(db.profilehistory, { foreignKey: 'profilehistory_id', targetKey: 'id' });
db.approvals.belongsTo(db.loan, { foreignKey: 'loan_id', targetKey: 'id' });
db.approvals.belongsTo(db.loanhistory, { foreignKey: 'loanhistory_id', targetKey: 'id' });
db.approvals.belongsTo(db.deposithistory, { foreignKey: 'deposithistory_id', targetKey: 'id' });
db.approvals.belongsTo(db.investment, { foreignKey: 'investment_id', targetKey: 'id' });
db.approvals.belongsTo(db.deposit, { foreignKey: 'deposit_id', targetKey: 'id' });
db.approvals.belongsTo(db.repaymenthistory, { foreignKey: 'repaymenthistory_id', targetKey: 'id' });
db.approvals.belongsTo(db.profile, { foreignKey: 'maker_id', targetKey: 'id', as: 'maker' });
db.approvals.belongsTo(db.profile, { foreignKey: 'checker_id', targetKey: 'id', as: 'checker' });
db.loan.hasMany(db.repaymenthistory, { foreignKey: 'loan_id', targetKey: 'id' });
db.deposit.hasMany(db.deposithistory, { foreignKey: 'deposit_id', targetKey: 'id' });
module.exports = db;