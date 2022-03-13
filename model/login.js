const md5 = require('md5')
var mysqlConnection = require('./dbconnection')

exports.login = function (email, password) {
    return new Promise(function (resolve, reject) {
        mysqlConnection.query("SELECT * FROM user where email=? AND pswd=? limit 1"
            , [
                email,
                md5(password)
            ], (error, result) => {
                if (error) {
                    //console.logerror);
                    reject(error);

                }
                resolve(result);


            })
    }).then((result) => {
        return result;
    }).catch((error) => {
        //console.logerror);
        return false

    })
}
exports.usernameLogin = function (username,password) {
    return new Promise(function (resolve, reject) {
        mysqlConnection.query("SELECT * FROM user where username=? AND pswd=? limit 1"
            , [
                username,
                md5(password)
            ], (error, result) => {
                if (error) {
                    //console.logerror);
                    reject(error);
                }
                resolve(result);
            })
    }).then((result) => {
        return result;
    }).catch((error) => {
        //console.logerror);
        return false

    })
}


exports.relogin = function (email, password, userId, username) {
    return new Promise(function (resolve, reject) {
        mysqlConnection.query("SELECT * FROM user where email=? AND pswd=? AND username=? AND userId=? limit 1"
            , [
                email,
                password,
                username,
                userId
            ], (error, result) => {
                if (error) {
                    //console.logerror);
                    reject(error);

                }
                resolve(result);


            })
    }).then((result) => {
        return result;
    }).catch((error) => {
        //console.logerror);

    })

}


