const sql = require('mysql');
var connPoolPromise = null;
module.exports = function (configs) {
    const config = configs;
    if (connPoolPromise) {
        return connPoolPromise;
    }
    connPoolPromise = new Promise(function (resolve, reject) {
        var conn = sql.createPool(config);
        conn.getConnection(function (err, connPool) {
            if (err) {
                connPoolPromise = null;
                return reject(err);
            } else {
                return resolve(connPool);
            }
        });
    });
    return connPoolPromise;

}