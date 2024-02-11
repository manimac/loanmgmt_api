module.exports = {
    //live
    config: {
        host: 'da-1.de.hostns.io',
        port: '3306',
        database: 'madrastechnologies_loanmgmt',
        user: 'madrastechnologies_loanmgmt',
        password: 'loanmgmt',
        dialect: "mysql",
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
    //test
    // config: {
    //     host: 'da-1.de.hostns.io',
    //     port: '3306',
    //     database: 'madrastechnologies_loanmgm',
    //     user: 'madrastechnologies_loanmgm',
    //     password: 'loanmgmt',
    //     dialect: "mysql",
    //     pool: {
    //         max: 5,
    //         min: 0,
    //         acquire: 30000,
    //         idle: 10000
    //     }
    // }
}