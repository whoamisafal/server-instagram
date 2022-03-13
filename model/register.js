var mysqlConnection = require('./dbconnection');
var md5 = require('md5');
const { generateCode } = require('./helper');
const { sendMail } = require('./sendMail');
exports.register = function (email, fullname, username, password) {
    return new Promise(function (resolve, reject) {
        var created_ate = new Date().getTime();
        var sql = "INSERT INTO user(email,username,fullname,user_type,created_date,verification,pswd,profile) VALUES(?,?,?,?,?,?,?,?)";
        mysqlConnection.beginTransaction(function (error) {
            if (error) {
                mysqlConnection.rollback(function () {
                    mysqlConnection.end()
                })
                reject(error)
            } else {
                mysqlConnection.query(sql, [
                    email,
                    username,
                    fullname,
                    'user',
                    created_ate,
                    0,
                    md5(password),
                    'assets/media/images/profile/profile.jpg'
                ], function (err, result) {
                    if (err) {
                        mysqlConnection.rollback(function () {
                            // mysqlConnection.end()
                        })
                        reject(err)
                        return;
                    } else {
                        let userId = result.insertId
                        let account_visiblity = 'Public'
                        let account_type = 'Personnel'
                        let description = ''
                        let lastmodified = new Date().getUTCMilliseconds()
                        let account_status = 'Active'
                        let insertQ = "INSERT INTO userinfo(userId,account_visiblity,account_type,description,date_of_birth,last_modified,account_status,website) VALUES(?,?,?,?,?,?,?,?)"
                        mysqlConnection.query(insertQ, [
                            userId,
                            account_visiblity,
                            account_type,
                            description,
                            null,
                            lastmodified,
                            account_status,
                            null
                        ], function (err, res) {
                            if (err) {
                                mysqlConnection.rollback(function () {
                                    // mysqlConnection.end()
                                })
                                reject(err)
                                return;
                            } else {
                                //email	timestamp	cookiesvalue	code

                                let code = generateCode(6)
                                let value = md5(email + username + code, 64)


                                let insertQ = "INSERT INTO emailverifier(email,cookiesvalue,code) VALUES(?,?,?)"
                                mysqlConnection.query(insertQ, [
                                    email,
                                    value,
                                    code
                                ], (err, result) => {
                                    if (err) {
                                        console.log(err);
                                        mysqlConnection.rollback(function () {
                                            // mysqlConnection.end()
                                        })
                                        reject(err)
                                        return;
                                    }
                                    sendMail(email, "Email Verification code", `<h1>Email Verification code</h1><p>Your verification code is ${code}</p>`)
                                        .then(function (result) {
                                            if (result != null) {
                                                mysqlConnection.commit(function (error) {
                                                    if (error) {
                                                        mysqlConnection.rollback(function () {
                                                            // mysqlConnection.end()
                                                        })
                                                    } else {
                                                        resolve({
                                                            token: value,
                                                            status: 'ok'
                                                        });
                                                        // mysqlConnection.end()
                                                    }
                                                })
                                            }
                                        })

                                })


                            }

                        })
                    }




                })
            }
        })



    }).then(function (result) {
        ////console.log)(result);
        return result

    }).catch(function (err) {
        mysqlConnection.rollback(function () { })
        return false;
    });
}

exports.getUserInfo = function (userId) {
    const query = 'SELECT user.fullname,user.email,user.user_type,user.verification,user.profile,userinfo.description,userinfo.date_of_birth,userinfo.account_status,userinfo.account_visiblity,userinfo.gender,userinfo.website FROM user JOIN userinfo ON user.userId=userinfo.userId WHERE user.userId=?';
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [userId], function (err, result) {
            if (err) {
                reject({ "error": "error in fetching user information", status: 500 });
            }

            resolve(result);

        })
    }).then(function (result) {
        return result
    }).catch((error) => {
        return error;
    })
}
exports.getUserInfoByUsername = function (username) {
    const query = 'SELECT user.userId,userinfo.website,user.username,user.fullname,user.user_type,user.profile,userinfo.description,userinfo.date_of_birth,userinfo.account_status,userinfo.account_visiblity FROM user JOIN userinfo ON user.userId=userinfo.userId WHERE user.username=? AND user.userId=(SELECT userId FROM user WHERE username=?)';

    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [username, username], function (err, result) {
            if (err) {
                reject({ "error": "error in fetching user information", status: 500 });
            }
            ////console.log)(result);

            resolve(result);

        })
    }).then(function (result) {
        return result
    }).catch((error) => {
        ////console.log)(error);
        return { "error": "error in fetching user information", status: 500 };
    })
}
exports.getUserInfoByUserId = function (userId) {
    //console.loguserId);
    const query = 'SELECT userId,username,fullname,user.profile FROM user  WHERE userId=? LIMIT ?';

    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [userId, 1], function (err, result) {
            if (err) {
                reject({ "error": "error in fetching user information", status: 500 });
            }
            ////console.log)(result);
            //console.logresult);
            resolve(result);

        })
    }).then(function (result) {
        return result
    }).catch((error) => {
        ////console.log)(error);
        return { "error": "error in fetching user information", status: 500 };
    })
}


exports.updateProfile = function (userId, profile) {
    const query = 'UPDATE user SET profile=? WHERE userId=?';
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [profile, userId], function (err, result) {
            if (err) {
                reject({ "error": "error in updating profile", status: 500 });
            }
            resolve(result);
        })
    }).then(function (result) {
        return true
    }).catch((error) => {
        return false
    })


}


exports.followUser = function (userId, followingId) {
    console.log(followingId);
    return new Promise((resolve, reject) => {
        var checkQuery = "SELECT * FROM followers WHERE followed_by=? AND followed_to=? limit 1";

        mysqlConnection.query(checkQuery, [userId, followingId], function (err, result) {
            if (err) {
                reject({ "error": "error in checking user", status: 500 });
            }
            if (result.length > 0) {
                let deleteFollowing = "DELETE FROM followers WHERE followed_by=? AND followed_to=?";
                mysqlConnection.query(deleteFollowing, [userId, followingId], function (err, result) {
                    if (err) {
                        reject({ "error": "error in deleting following", status: 500 });
                    }
                    resolve(result);
                })

                resolve({ "error": "already following", status: 500 });
            } else {
                let timestamp = new Date().getTime();
                let isFollowedRequest = 0;
                let getUserInfo = "SELECT account_visiblity FROM userinfo WHERE userId=?";
                mysqlConnection.query(getUserInfo, [followingId], function (err, result) {
                    if (err) {
                        reject({ "error": "error in getting user info", status: 500 });
                    }
                    if (result[0].account_visiblity.toLocaleLowerCase() != 'Public'.toLocaleLowerCase()) {
                        isFollowedRequest = 1;
                    }

                    var insertQuery = "INSERT INTO followers(followed_by,followed_to,timestamp,isFollowRequest) VALUES(?,?,?,?)";
                    mysqlConnection.query(insertQuery, [userId, followingId, timestamp, isFollowedRequest], function (err, result) {
                        if (err) {
                            ////console.log)(err);
                            reject({ "error": "error in following user", status: 500 });
                        }
                        resolve(result);
                    })

                    resolve({ "error": "user is private", status: 500 });

                })





            }
        })
    }).then((result) => { return true })
        .catch((error) => {
            ////console.log)(error);
            return false
        })





}

exports.isFollowing = function (currentUserId, userId) {

    return new Promise((resolve, reject) => {
        var checkQuery = "SELECT * FROM followers WHERE followed_by=? AND followed_to=? limit 1";

        mysqlConnection.query(checkQuery, [currentUserId, userId], function (err, result) {
            if (err) {
                reject({ "error": "error in checking user", status: 500 });
            }
            if (result.length > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        })
    }).then((result) => { return result })
        .catch((error) => {
            ////console.log)(error);
            return false
        })

}


exports.updateUserInfo = function (userId, userInfo) {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE user SET fullname=? WHERE userId=?';
        let timestamp = new Date().getTime();
        const query1 = 'UPDATE userinfo SET description=?,last_modified=?,date_of_birth=?,website=?,gender=? where userId=?'
        mysqlConnection.beginTransaction(function (err) {
            if (err) {
                ////console.log)(err);
                reject({ "error": "error in updating user information", status: 500 });
            }
            mysqlConnection.query(query, [userInfo.fullname, userId], function (err, result) {
                if (err) {
                    ////console.log)(err);
                    mysqlConnection.rollback(function (err) {
                        reject({ "error": "error in updating user information", status: 500 });
                    })

                }
            })
            mysqlConnection.query(query1, [userInfo.bio, timestamp, userInfo.date_of_birth, userInfo.website, userInfo.gender, userId], function (err, result) {
                if (err) {
                    ////console.log)(err);
                    mysqlConnection.rollback(function (err) {
                        reject({ "error": "error in updating user information", status: 500 });
                    })

                }
            })
            mysqlConnection.commit(function (err) {
                if (err) {
                    mysqlConnection.rollback(function (err) {
                        reject({ "error": "error in updating user information", status: 500 });
                    })
                }
                resolve({
                    "message": "user information updated successfully",
                    "status": 200

                });
            })


        })
    }).then(function (result) {
        return result
    }).catch((error) => {
        return error
    });
}

exports.checkUser = function (email) {
    const query = 'SELECT * FROM user WHERE email=?';
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [email], function (err, result) {
            if (err) {
                reject({ "error": "error in checking user", status: 500 });
            }
            console.log(result);
            resolve(result.length > 0 ? true : false);
        })
    }).then(function (result) {
        return result
    }).catch((error) => {
        return { "error": "error in checking user", status: 500 };
    })
}

exports.passwordStrength = function (password) {

    var strength = 0
    if (password.length < 6) {
        return strength
    }
    if (password.length >= 6) {
        strength += 1
    }
    if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
        strength += 1
    }
    if (password.match(/([a-zA-Z])/) && password.match(/([0-9])/)) {
        strength += 1
    }
    if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) {
        strength += 1
    }
    if (password.match(/(.*[!,%,&,@,#,$,^,*,?,_,~].*[!,%,&,@,#,$,^,*,?,_,~])/)) {
        strength += 1
    }
    return strength




}

exports.create_new_password = function (email, password, pcode) {
    let hashPassword = md5(password);
    return new Promise((resolve, reject) => {
        const getUserInfo = "SELECT * FROM user WHERE email=?";
        mysqlConnection.beginTransaction(function (err) {
            if (err) reject(false)
            mysqlConnection.query(getUserInfo, [email], function (err, result) {
                if (err) reject(false)
                if (result.length > 0) {
                    let oldPassword = result[0].pswd;
                    const query = 'UPDATE user SET pswd=? WHERE email=?';
                    mysqlConnection.query(query, [hashPassword, email], function (err, result) {
                        if (err) reject(false)
                        const query1 = 'UPDATE passwordchanger SET old_password=? WHERE passwordChangeCode=? AND email=?';
                        mysqlConnection.query(query1, [oldPassword, pcode, email], function (err, result) {
                            if (err) reject(false)
                            mysqlConnection.commit(function (err) {
                                if (err) {
                                    mysqlConnection.rollback(function (err) {
                                        reject(false)
                                    })
                                }
                                resolve(true)
                            })
                        })
                    })
                }
            })


        })
    }).then(function (result) {
        return result
    }).catch((err) => {
        console.log(err);
        return false
    })



}

exports.IsRestrictedUserName = function (username) {
    let usernames = [
        "admin",
        "administrator",
        "insta",
        "instagram",
        "facebook",
        "twitter",
        "google",
        "youtube",
        "linkedin",
        "github",
        "bitbucket",
        "stackoverflow",
        "settings",
        "accounts",
        "account",
        "profile",
        "profiles",
        "signup",
        "signin",
        "signout",
        "login",
        "inbox",
        "inboxs",
        "create",
        "explore",
        "people",
        "p",
        "search",
    ];
    if (usernames.includes(username)) {
        return true
    }
    
    return false
}

exports.isDuplicateUserName = function (username) {
 
    const query = 'SELECT * FROM user WHERE username=?';
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [username], function (err, result) {
            if (err) {
                reject({ "error": "error in checking user", status: 500 });
            }
            resolve(result.length > 0 ? true : false);
        })
    }).then(function (result) {
        return result
    }).catch((error) => {
        return { "error": "error in checking user", status: 500 };
    })
}
exports.isDuplicateEmail = function (email) {
    const query = 'SELECT * FROM user WHERE email=?';
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [email], function (err, result) {
            if (err) {
                reject({ "error": "error in checking user", status: 500 });
            }
            resolve(result.length > 0 ? true : false);
        })
    }).then(function (result) {
        return result
    }).catch((error) => {
        return { "error": "error in checking user", status: 500 };
    })
}
exports.containsSpaceInUserName = function (username) {
    if (username.indexOf(' ') > -1) {
        return true
    }
    return false
}
exports.isUsernameHasSpecialCharacters = function (username) {
    if (username.match(/[^a-zA-Z0-9]_./)) {
        return true
    }
    return false
}
exports.checkEmailVerificationToken = function (token) {
    let query = 'SELECT email FROM emailverifier WHERE cookiesvalue=? limit 1';
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [token], function (err, result) {
            if (err) {
                reject(false);
            }
            resolve(result.length > 0 ? result[0].email : false);
        })
    }).then(function (result) {
        return result
    }).catch((error) => {
        return false
    })

}

exports.resendEmailVerificationCode = function (email) {

    let code = generateCode(6);
    let query = 'UPDATE emailverifier SET code=? WHERE email=?';
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [code, email], function (err, result) {
            if (err) {
                reject(false);
            }
            resolve(true);
        })
    }).then(function (result) {
        if (result) {
            sendMail(email, code).then(function (result) {
                return true
            }).catch((error) => {
                return false
            });
        }
        return result;
    }).catch((error) => {

        return false
    })





}
exports.updateVerification = function (email) {

    let query = 'UPDATE user SET verification=? WHERE email=?';
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [1, email], function (err, result) {
            if (err) {
                reject(false);
            }
            resolve(true);
        })
    }).then(function (result) {
        return result;
    }).catch((error) => {

        return false
    })


}
exports.verifyCode = function (token, code) {

    let query = 'SELECT email FROM emailverifier WHERE cookiesvalue=? AND code=?';
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [token, code], function (err, result) {
            if (err) {
                reject(false);
            }
            resolve(
                result.length > 0 ? result[0].email : false,

            );
        })
    }).then(function (result) {
        return result;
    }).catch((error) => {

        return false
    })


}
exports.getEmailVerificationToken = function (email) {
    let query="SELECT cookiesvalue FROM emailverifier WHERE email=?";
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query,[email],function(err,result){
            if(err){
               reject(false);
            }
            
            resolve(result.length>0?result[0].cookiesvalue:false);
        })
    }).then(function (result) {
        return result;
    }).catch((error) => {

        return false
    })
}
