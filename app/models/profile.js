const ProfileModel = (sequelize, Sequelize) => {
    const Profile = sequelize.define('Profile', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING, allowNull: true },
        mobile: { type: Sequelize.STRING, allowNull: true },
        fathername: { type: Sequelize.STRING, allowNull: true },
        image: { type: Sequelize.STRING, allowNull: true },
        dob: { type: Sequelize.STRING, allowNull: true },
        gender: { type: Sequelize.STRING, allowNull: true },
        role: { type: Sequelize.STRING, allowNull: true },
        address: { type: Sequelize.TEXT, allowNull: true },
        nomineename: { type: Sequelize.STRING, allowNull: true },
        nomineemobile: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.INTEGER, defaultValue: 0 },
        units: { type: Sequelize.STRING, allowNull: true },
        currentvalue: { type: Sequelize.STRING, allowNull: true },
        otp: { type: Sequelize.STRING, allowNull: true },
        accountno: { type: Sequelize.TEXT, allowNull: true },
        ifsc: { type: Sequelize.TEXT, allowNull: true },
        path: {
            type: Sequelize.VIRTUAL,
            get() {
                return `${process.env.baseUrl}uploads/profile/`
            }
        }
    })

    return Profile
}

module.exports = ProfileModel