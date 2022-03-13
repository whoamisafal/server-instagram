const connection = require('./dbconnection');
var md5 = require('md5');
const mysqlConnection = require('./dbconnection');
const { func } = require('prop-types');
const register = require('./register');
const { resolve } = require('path/posix');
const { sendMail } = require('./sendMail');
exports.getFollowerCount = function (userId) {
    let val = 0
    const query = "SELECT COUNT(*) as count FROM followers WHERE followed_to=? AND isFollowRequest=?";
    return new Promise(function (resolve, reject) {
        connection.query(query, [parseInt(userId), val], function (err, result) {
            if (err) reject(err);
            try {
                if (result.length > 0)
                    resolve(result[0].count)
            } catch (error) {
                reject(error)
            }



        });
    }).then(function (result) {

        return result
    }).catch(function (err) { throw err; })

}

exports.getFollowingCount = function (userId) {
    let val = 0
    const query = "SELECT COUNT(*) as count FROM followers WHERE followed_by=? AND isFollowRequest=?";
    return new Promise(function (resolve, reject) {
        connection.query(query, [parseInt(userId), val], function (err, result) {
            if (err)
                reject(err);
            try {
                if (result.length > 0)
                    resolve(result[0].count)
            } catch (error) {
                reject(error)
            }


        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        throw err;
    })
}


exports.changePassword = function (userId, oldPassword, newPassword, confirmPassword) {
    //console.loguserId, oldPassword, newPassword, confirmPassword);
    if (newPassword != confirmPassword) {
        //console.log"password not matched");
        return new Promise(function (resolve, reject) {
            resolve({
                status: 400,
                message: "New password and confirm password does not match"
            })
        }).then(function (result) {
            return result;
        }).catch(function (err) {
            throw err;
        })
    } else {
        //Check Old Password 
        const query = "SELECT * FROM user where userId=? AND pswd=?";
        //console.loguserId);
        return new Promise(function (resolve, reject) {
            connection.query(query, [parseInt(userId), md5(oldPassword)], function (err, result) {
                if (err)
                    reject(err);
                resolve(result)

            })
        }).then(function (result) {

            //Change Password
            if (result.length > 0) {
                const query = "UPDATE user SET pswd=? WHERE userId=?";
                return new Promise(function (resolve, reject) {
                    connection.query(query, [md5(newPassword), parseInt(userId)], function (err, result) {
                        if (err)
                            resolve({
                                status: 400,
                                message: "Error in changing password"
                            });
                        if (result.affectedRows > 0)
                            resolve({
                                status: 200,
                                message: "Password changed successfully"
                            })
                        //console.logresult);

                    })
                }).then(function (result) {
                    return result;
                }).catch(function (err) {
                    throw err;
                })
            } else {
                return new Promise(function (resolve, reject) {
                    resolve({
                        status: 400,
                        message: "Old password is incorrect"
                    })
                }).then(function (result) {
                    return result;
                }).catch(function (err) {
                    throw err;
                })
            }
        }).catch(function (err) {
            throw err;
        })
    }

}


//get all the followers 
exports.getFollowers = function (userId) {

    const query = "SELECT user.username,user.fullname,user.userId,user.profile FROM user join followers ON user.userId=followers.followed_by WHERE followed_to=? AND isFollowRequest=?";
    return new Promise(function (resolve, reject) {
        connection.query(query, [parseInt(userId), 0], function (err, result) {
            if (err)
                reject(false);
            resolve(result)

        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        return false
    })
}

//get all the following 
exports.getFollowing = function (userId) {
    const query = "SELECT user.username,user.fullname,user.userId,user.profile FROM user join followers ON user.userId=followers.followed_to WHERE followed_by=? AND isFollowRequest=?";
    return new Promise(function (resolve, reject) {
        connection.query(query, [parseInt(userId), 0], function (err, result) {
            if (err)
                reject(false);
            resolve(result)

        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        return false
    })
}



//Check the account is private or public 
exports.getAccountPrivacy = function (userId) {
    const query = "SELECT * FROM user WHERE userId=?";
    return new Promise(function (resolve, reject) {
        connection.query(query, [parseInt(userId)], function (err, result) {
            if (err)
                reject(err);
            resolve(result)

        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        throw err;
    })
}

//Check the account is private or public 
exports.setAccountPrivacy = function (userId, isPrivate) {
    const query = "UPDATE user SET isPrivate=? WHERE userId=?";
    return new Promise(function (resolve, reject) {
        connection.query(query, [isPrivate, parseInt(userId)], function (err, result) {
            if (err)
                reject(err);
            resolve(result)

        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        throw err;
    })
}

//Posting a status


exports.postStatus = function (userId, username, tags, files, caption) {
    let timestamp = new Date().getTime();
    let postUrl = '/p/' + md5(username + timestamp, 32);

    const query = "INSERT INTO post(userId,postUrl,timestamp,caption) VALUES(?,?,?,?)";
    return new Promise(function (resolve, reject) {
        connection.beginTransaction(function (err) {

            if (err) {
                //console.logerr);
                reject({
                    status: 400,
                    message: "Error in posting"
                })
                return
            }
            connection.query(query, [parseInt(userId), postUrl, timestamp, caption], function (err, result) {
                if (err) {
                    //console.logerr);
                    return connection.rollback(function () {
                        reject({
                            status: 400,
                            message: "Error in posting"
                        })
                        return
                    });
                }
                let len = files.length
                var success = 0
                let postId = result.insertId
                let query1 = "INSERT INTO insta_media(postId,mimetype,url) VALUES(?,?,?)"
                for (let i = 0; i < len; i++) {
                    connection.query(query1, [
                        postId,
                        files[i].mimetype,
                        files[i].path

                    ], function (err, result) {
                        if (err) {
                            //console.logerr);
                            return connection.rollback(function () {
                                reject({
                                    status: 403,
                                    message: "Error in posting"
                                })
                            });
                        }



                    });
                    success = success + 1

                }

                if (success == len) {

                    let query2 = "INSERT into hashtag(postId,value) VALUES(?,?)"
                    let hashArray = tags.split(',')
                    let hashLen = hashArray.length
                    let hashStatus = hashArray && hashArray[0]

                    let hashSuccess = 0

                    if (hashStatus != 'null') {

                        for (let i = 0; i < hashLen; i++) {
                            connection.query(query2, [
                                postId,
                                hashArray[i]
                            ], function (err, result) {
                                if (err) {
                                    //console.logerr);
                                    return connection.rollback(function () {
                                        reject({
                                            status: 403,
                                            message: "Error in posting"

                                        })
                                    });

                                }
                                hashSuccess++
                                if (hashSuccess == hashLen) {
                                    connection.commit(function (err) {
                                        if (err) {
                                            //console.logerr);
                                            return connection.rollback(function () {
                                                reject({
                                                    status: 403,
                                                    message: "Error in posting"
                                                })
                                            });
                                        }
                                        //console.log'success!');
                                        resolve({
                                            status: 200,
                                            message: "Post created successfully",
                                            url: postUrl
                                        })
                                    });
                                }
                            });
                        }
                    } else {
                        connection.commit(function (err) {
                            if (err) {
                                //console.logerr);
                                return connection.rollback(function () {
                                    reject({
                                        status: 403,
                                        message: "Error in posting"
                                    })
                                });
                            }
                            //console.log'success!');
                            resolve({
                                status: 200,
                                message: "Post created successfully",
                                url: postUrl
                            })
                        });
                    }
                } else {
                    connection.rollback(function () {
                        //console.log'fail!');
                        reject({
                            status: 403,
                            message: "Error in posting"

                        })
                    });
                }



            });

        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        return err;
    })




}

//get All the following Id
getAllFollowingIds = function (userId) {
    const query = "SELECT user.userId FROM user join followers ON user.userId=followers.followed_to WHERE followed_by=? AND isFollowRequest=?";
    return new Promise(function (resolve, reject) {
        connection.query(query, [parseInt(userId), 0], function (err, result) {
            if (err)
                reject(err);
            resolve(result)

        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        throw err;
    })
}
exports.getAllFollowingIds = getAllFollowingIds
//Transaction in node.js
exports.getPosts = async function (userId, offset, limit) {
    let userIds = await getAllFollowingIds(userId)
    let followingIds = []
    for (const key in userIds) {
        followingIds.push(userIds[key].userId)
    }
    followingIds.push(userId)
    //console.logoffset,limit);
    const query = `SELECT post.postId,post.postUrl,post.userId,post.timestamp,post.caption,insta_media.mediaId,insta_media.mimetype,insta_media.url 
    FROM post INNER JOIN insta_media ON post.postId=insta_media.postId WHERE post.userId IN (?)  ORDER BY post.timestamp DESC LIMIT ?,?`;
    return new Promise(function (resolve, reject) {
        connection.query(query, [followingIds, parseInt(offset), parseInt(limit)], function (err, result) {
            if (err)
                reject(err);
            resolve(result)
        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        return err;
    })
}


exports.createGroupChat = function (userId, users) {


}
exports.createChat = function (userId, chatWith) {
    let id = chatWith.userId
    let table = 'initconversation'
    //get the currentTimestamp
    let timestamp = new Date().getTime()
    let query = "INSERT into " + table + "(timestamp,senderId,receiverId,isAccept,isIgnore) VALUES(?,?,?,?,?)"
    let checkQ = "SELECT * from " + table + " where senderId=? AND receiverId=? || senderId=? AND receiverId=?  limit ?"
    return new Promise(function (resolve, reject) {
        mysqlConnection.query(checkQ, [
            userId,
            id,
            id,
            userId,
            1
        ], (err, result) => {
            if (err) {

                reject(false);
            }

            if (result.length == 0) {
                mysqlConnection.query(query, [timestamp, userId, id, 0, 0], (err, result) => {
                    if (err) {
                        console.log(err);
                        reject(false);
                    }
                    if (result === undefined) {
                        console.log("Something went's wrong while creating chat");
                        reject(false)
                        return
                    } else {
                        resolve(result.insertId)
                    }

                })
            } else {
                resolve(chatWith)
            }
        })

    }).then((result) => {
        //console.logresult);
        return result
    }).catch((err) => {
        return false
    })

}

exports.getAllChatUsers = function (userId) {

    let query = `
    SELECT DISTINCT user.userId,user.username,
    user.username,user.profile,user.fullname FROM user INNER JOIN 
         initconversation ON user.userId=initconversation.senderId || user.userId=initconversation.receiverId WHERE 
         user.userId!=? AND
         isAccept=1 AND initconversation.receiverId=? || initconversation.senderId=? AND isIgnore=0
         ORDER BY initconversation.timestamp DESC
    `
    return new Promise(function (resolve, reject) {
        mysqlConnection.query(query, [userId, userId, userId], (err, result) => {
            if (err) {
                reject(false);
            }
            resolve(result)
        })

    }).then((result) => {

        return result
    }).catch((err) => {
        return false
    })
}
exports.likePost = function (postId, userId, currentUserId) {
    let table = 'likes'
    return new Promise(function (resolve, reject) {
        mysqlConnection.beginTransaction(function (err) {
            if (err) reject(err)
            let timestamp = new Date().getTime()
            //Check if the user has already liked the post
            let query1 = "SELECT * FROM " + table + " WHERE postId=? AND liked_by=?"
            mysqlConnection.query(query1, [postId, currentUserId], (err, result) => {
                if (err) reject(err)
                if (result.length == 0) {
                    // if the user has not liked the post
                    let query2 = "INSERT INTO " + table + "(postId,liked_by,pc_by,timestamp) VALUES(?,?,?,?)"
                    mysqlConnection.query(query2, [postId, currentUserId, userId, timestamp], (err, result) => {
                        if (err) reject(err)
                        resolve(result)
                    })
                } else {
                    //delete the like
                    let query2 = "DELETE FROM " + table + " WHERE postId=? AND liked_by=?"
                    mysqlConnection.query(query2, [postId, currentUserId], (err, result) => {
                        if (err) reject(err)
                        resolve(result)

                    })
                }
            })
            mysqlConnection.commit(function (err) {
                if (err) {
                    mysqlConnection.rollback(function () {
                        reject(err)
                    })
                }
                resolve(true)
            })
        })
    })
        .then(function (result) {
            return result
        })
        .catch(function (err) {
            return false
        })
}
exports.checkLike = function (postId, userId) {
    let table = 'likes'
    let query = "SELECT * FROM " + table + " WHERE postId=? AND liked_by=? limit ?"
    return new Promise(function (resolve, reject) {
        mysqlConnection.query(query, [postId, userId, 1], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    }).then((result) => {
        return result
    }).catch((err) => {
        return false
    })
}

exports.commentPost = function (postId, comment, userId, parentCommentId, commentType) {
    let table = 'comment'
    let timestamp = new Date().getTime()
    let query = "INSERT INTO " + table + "(postId,userId,comment_content,timestamp,parentId,comment_type,isModified) VALUES(?,?,?,?,?,?,?)"

    return new Promise(function (resolve, reject) {
        mysqlConnection.query(query, [postId, userId, comment, timestamp, parentCommentId, commentType, 0], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    }).then((result) => {
        return result
    }).catch((err) => {
        return false
    })
}

exports.getCommentCount = function (postId) {
    let table = 'comment'
    let query = "SELECT COUNT(*) as count FROM " + table + " WHERE postId=?"
    return new Promise(function (resolve, reject) {
        mysqlConnection.query(query, [postId], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    }).then((result) => {
        return result
    }
    ).catch((err) => {
        return false
    })

}
exports.getLikeCount = function (postId) {
    let table = 'likes'
    let query = "SELECT COUNT(*) as count FROM " + table + " WHERE postId=?"
    return new Promise(function (resolve, reject) {
        mysqlConnection.query(query, [postId], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    }).then((result) => {
        return result
    }).catch((err) => {
        return false
    })
}

exports.getPostIdFromTag = function (tag) {
    let table = 'hashtag'
    tag = "#" + tag
    let query = "SELECT postId FROM " + table + " WHERE value=?"
    return new Promise(function (resolve, reject) {
        mysqlConnection.query(query, [tag], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    }).then((result) => {
        return result
    }).catch((err) => {
        return false
    })
}



exports.getPostByTag = async function (tag) {
    let postIdResult = await this.getPostIdFromTag(tag)
    let postId = []
    for (let i = 0; i < postIdResult.length; i++) {
        postId.push(postIdResult[i].postId)
    }

    if (postIdResult.length > 0) {
        return new Promise(function (resolve, reject) {
            let query = `SELECT post.postId,post.postUrl,
            post.userId,post.timestamp,insta_media.mimetype,insta_media.url
            from post inner join insta_media on post.postId=insta_media.postId
            where post.postId in (?) ORDER BY post.timestamp DESC`
            mysqlConnection.query(query, [postId], (err, result) => {
                if (err) reject(err)
                resolve(result)
            })
        }).then((result) => {
            return result
        }).catch((err) => {
            console.log(err);
            return false
        })
    } else {
        return false
    }

}
exports.getPostByUrl = function (url) {
    url = '/p/' + url
    let query = `SELECT post.postId,post.postUrl,post.userId,post.timestamp,post.caption,
    insta_media.mimetype,insta_media.url
     FROM post INNER JOIN insta_media ON post.postId=insta_media.postId WHERE post.postUrl=?`
    return new Promise(function (resolve, reject) {
        mysqlConnection.query(query, [url], (err, result) => {
            if (err) reject(err)

            resolve(result)
        })
    }).then((result) => {
        return result
    }).catch((err) => {
        return false
    })
}

exports.getMorePost = async function (postId, userId) {
    let userInfo = await register.getUserInfo(userId)
    if (userInfo[0].account_visiblity.toLowerCase() === "private") {
        return false
    }
    return new Promise(function (resolve, reject) {
        let query = `SELECT post.postId,post.postUrl,post.userId,post.timestamp,post.caption,
        insta_media.mimetype,insta_media.url
         FROM post INNER JOIN insta_media ON post.postId=insta_media.postId WHERE post.postId!=? ORDER BY post.timestamp DESC LIMIT 15`
        mysqlConnection.query(query, [postId], (err, result) => {
            if (err) reject(err)

            resolve(result)
        })
    }).then((result) => {
        return result
    }).catch((err) => {
        return false
    })


}
exports.getExplores = async function () {


    let query = `SELECT post.postId,post.postUrl,post.userId,post.timestamp,post.caption,
    insta_media.mimetype,insta_media.url
     FROM post INNER JOIN insta_media ON post.postId=insta_media.postId  ORDER BY post.timestamp DESC`
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, (err, result) => {
            if (err) reject(false)
            resolve(result)
        })
    })
        .then((result) => result)
        .catch((err) => false)





}
const getAllFollowerIds = async function (userId) {
    const query = "SELECT user.userId FROM user join followers ON user.userId=followers.followed_by WHERE followed_to=? AND isFollowRequest=?";
    return new Promise(function (resolve, reject) {
        connection.query(query, [parseInt(userId), 0], function (err, result) {
            if (err)
                reject(err);
            resolve(result)

        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        throw err;
    })
}
exports.getAllFollowerIds = getAllFollowerIds


const getAllUserWhoFollowedByYourFollowingIds = async function (ids, userId) {
    let query = "SELECT DISTINCT  u.userId,u.username,u.profile,u.fullname,ui.account_visiblity FROM user u  INNER JOIN userinfo ui ON ui.userId=u.userId INNER JOIN followers  f ON u.userId=f.followed_by WHERE u.userId NOT IN (?) AND u.userId!=?"
    return new Promise(function (resolve, reject) {
        connection.query(query, [ids, userId], function (err, result) {
            if (err)
                reject(err);

            resolve(result)

        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        console.log(err);
        return false
    })
}
exports.getAllUserWhoFollowedByYourFollowingIds = getAllUserWhoFollowedByYourFollowingIds

const getLimitedNewUsers = async function (currentUserId, userIds, limit) {
    const query = "SELECT user.userId,user.username,user.fullname,user.profile,ui.account_visiblity FROM user INNER JOIN userinfo ui ON ui.userId=user.userId WHERE user.userId NOT IN (?) AND user.userId!=? ORDER BY user.created_date DESC LIMIT ?";
    return new Promise(function (resolve, reject) {
        connection.query(query, [userIds, currentUserId, limit], function (err, result) {
            if (err)
                reject(err);
            resolve(result)

        })
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        throw err;
    })
}
exports.getSuggestions = async function (userId) {
    //get all the user id which you are  currently following
    let followingIds = await getAllFollowingIds(userId)
    // get all the followers id which are followed by then to you
    let followerIds = await getAllFollowerIds(userId)
    let allIds = []
    let followers = []
    for (let i = 0; i < followingIds.length; i++) {
        allIds.push(followingIds[i].userId)
    }
    for (let index = 0; index < followerIds.length; index++) {
        followers.push(followerIds[index].userId)

    }
    allIds.push(userId)
    let suggestedUserInfos = []
    let userInfos = []
    //Get the user info of all the user which is not following by you
    if (followingIds != false) {
        userInfos = await getAllUserWhoFollowedByYourFollowingIds(allIds, userId)
    }

    let newUserInfos = []


    // Fetch the new user info which is not following by you
    if (userInfos != false) {
        for (let index = 0; index < userInfos.length; index++) {
            allIds.push(userInfos[index].userId)
            suggestedUserInfos.push(userInfos[index])
        }
        newUserInfos = await getLimitedNewUsers(userId, allIds, 7)
        if (newUserInfos != false) {
            for (let index = 0; index < newUserInfos.length; index++) {
                suggestedUserInfos.push(newUserInfos[index])
            }
        }
    } else {
        newUserInfos = await getLimitedNewUsers(userId, allIds, 15)
        if (newUserInfos != false) {
            for (let index = 0; index < newUserInfos.length; index++) {
                suggestedUserInfos.push(newUserInfos[index])
            }
        }

    }

    return { suggestedUserInfos: suggestedUserInfos, followers: followers }

}

exports.getUserPosts = async function (userId) {

    let query = `SELECT post.postId,post.postUrl,post.userId,post.timestamp,post.caption,
    insta_media.mimetype,insta_media.url
     FROM post INNER JOIN insta_media ON post.postId=insta_media.postId WHERE post.userId=? ORDER BY post.timestamp DESC`
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [userId], (err, result) => {
            if (err) reject(false)
            resolve(result)
        })
    }).then((result) => result).catch((err) => false)


}
exports.isFollowing = async function (userId, followedBy) {

    return new Promise((resolve, reject) => {

        let query = `SELECT * FROM followers WHERE followed_to=? AND followed_by=? AND isFollowRequest=?`
        mysqlConnection.query(query, [userId, followedBy, 0], (err, result) => {
            if (err) reject(false)
            console.log(result);
            resolve(result.length > 0 ? true : false)
        })
    }).then((result) => result).catch((err) => false)



}
exports.savePost = async function (postId, userId) {
    return new Promise((resolve, reject) => {
        //Check the post is already saved or not
        let timestamp = new Date().getTime()

        let query = `SELECT * FROM saved WHERE postId=? AND userId=?`
        mysqlConnection.query(query, [postId, userId], (err, result) => {
            if (err) reject(false)
            if (result.length > 0) {
                //Delete the post from saved post
                let query = `DELETE FROM saved WHERE postId=? AND userId=?`
                mysqlConnection.query(query, [postId, userId], (err, result) => {
                    if (err) reject(false)
                    resolve(false)
                })
                resolve(false)
            } else {
                query = `INSERT INTO saved (postId,userId,timestamp) VALUES (?,?,?)`
                mysqlConnection.query(query, [postId, userId, timestamp], (err, result) => {
                    if (err) reject(false)
                    resolve(true)
                })
            }
        })




    }).then((result) => result).catch((err) => false)
}

exports.isSavedPost = function (postId, userId) {
    let query = `SELECT * FROM saved WHERE postId=? AND userId=?`
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [postId, userId], (err, result) => {
            if (err) reject(false)
            resolve(result)
        })

    }).then((result) => result).catch((err) => false)
}
exports.getSavedPosts = function (userId) {
    let query = `SELECT post.postId,post.postUrl,post.userId,post.timestamp,post.caption,
    insta_media.mimetype,insta_media.url
     FROM post INNER JOIN insta_media ON post.postId=insta_media.postId INNER JOIN saved ON post.postId=saved.postId WHERE saved.userId=? ORDER BY saved.timestamp DESC`
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [userId], (err, result) => {
            if (err) reject(false)
            resolve(result)
        })

    }).then((result) => result).catch((err) => false)

}
exports.getComments = function (postId) {

    let query = `SELECT comment.isModified,comment.comment_content,comment.parentId,comment.commentId,comment.comment_type,comment.userId,comment.timestamp,user.username,user.profile
     FROM comment INNER JOIN user ON comment.userId=user.userId WHERE comment.postId=? ORDER BY comment.timestamp DESC`
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [postId], (err, result) => {
            if (err) reject(false)
            console.log(err);
            resolve(result)
        })

    }).then((result) => result).catch((err) => false)



}

exports.saveVisited = function (userId, visited_by) {

    //table name is visitor 
    // attribute are timestamp	visited_by	userId
    console.log(userId, visited_by);
    return new Promise((resolve, reject) => {
        let timestamp = new Date().getTime()
        let query = `INSERT INTO profilevisitor (visited_by,userId,timestamp) VALUES (?,?,?)`
        mysqlConnection.query(query, [visited_by, userId, timestamp], (err, result) => {
            console.log(result);
            if (err) reject(false)
            resolve(true)
        })

    }).then((result) => result).catch((err) => {
        console.log(err);
        return false
    })

}

exports.savePostViewer = function (userId, url) {
    url = '/p/' + url
    return new Promise((resolve, reject) => {
        let timestamp = new Date().getTime()
        //timestamp	postId	userId
        let query = `INSERT INTO postviewer (view_by,postUrl,timestamp) VALUES (?,?,?)`
        mysqlConnection.query(query, [userId, url, timestamp], (err, result) => {
            if (err) reject(false)
            console.log(err);
            resolve(true)
        })


    }).then((result) => result).catch((err) => false)
}

function generateCode(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < len; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
exports.generateCode = generateCode;


exports.sendResetPasswordCode = function (email) {

    let code = generateCode(6)
    return new Promise((resolve, reject) => {
        //table name is passwordreset
        // column are email	code	timestamp ucode expiretimestamp
        let checkAlreadyEmailExist = `SELECT * FROM passwordreset WHERE email=?`
        var timestamp = new Date().getTime()
        mysqlConnection.query(checkAlreadyEmailExist, [email], (err, result) => {
            // console.log(err);
            if (err) reject(false)
            if (result.length > 0) {
                let ucode = md5(timestamp + email, 16)
                let query = `UPDATE passwordreset SET code=?,timestamp=?,ucode=? WHERE email=?`
                mysqlConnection.query(query, [code, timestamp, ucode, email], (err, result) => {
                    // console.log(err);
                    if (err) reject(false)
                    resolve({ code: code, ucode: ucode })
                })
            } else {
                let ucode = md5(timestamp + email, 16)

                let query = `INSERT INTO passwordreset (email,code,timestamp,ucode) VALUES (?,?,?,?)`
                mysqlConnection.query(query, [email, code, timestamp, ucode], (err, result) => {
                    // console.log(err);
                    if (err) reject(false)
                    resolve({ code: code, ucode: ucode })
                })
            }
        })

    }).then((result) => result).catch((err) => {
        console.log(err);
        false
    })




}
function verifyPUCode(ucode) {
    //passwordreset
    //pid email code timestamp ucode
    //Verify the ucode and check the ucode is expire or not 
    //console.log(ucode);
    let query = 'SELECT email,timestamp from passwordreset where ucode=?'
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [ucode], (err, result) => {
            if (err) reject(false)
            resolve(result)
        })
    }).then((result) => {

        if (result === false) {
            return false
        }
        if (result.length > 0) {
            let row = result[0]
            let timestamp = new Date().getTime()
            let expire = parseInt(row.timestamp) + (1000 * 60 * 5)
            if (timestamp > expire) {
                return { message: 'Expired', status: 403 }
            }
            return { message: 'ok', status: 200 }
        } else {
            return { message: 'Invalid code', status: 403 }
        }

    })
        .catch((err) => {
            console.log(err);
            return false
        })
}
exports.verifyUCode = verifyPUCode;
exports.verifyUCode = function (code) {
    return verifyPUCode(code)
}

const insertPasswordChangeCode = function (email, code) {
    //email	passwordChangeCode	timestamp	old_password
    //table name is passwordchanger
    let timestamp = new Date().getTime()
    let query = `INSERT INTO passwordchanger (email,passwordChangeCode,timestamp) VALUES (?,?,?)`
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [email, code, timestamp], (err, result) => {
            if (err) reject(false)
            resolve(true)
        })
    }).then((result) => result).catch((err) => false)
}
exports.insertPasswordChangeCode = insertPasswordChangeCode;


exports.verifyCode = function (code, ucode) {
    //Check the ucode is expire or not 
    return new Promise((resolve, reject) => {
        verifyPUCode(ucode).then((result1) => {
            if (result1 === false) {
                reject({
                    message: 'Something went wrong',
                    status: 403
                })
            } else {
                if (result1.status === 403) {
                    reject(result1)
                } else {
                    let query = `SELECT * FROM passwordreset WHERE code=? AND ucode=?`
                    mysqlConnection.query(query, [code, ucode], async (err, result) => {
                        if (err) reject({
                            message: 'Something went wrong',
                            status: 403
                        })
                        if (result.length > 0) {
                            let email = result[0].email
                            let newCode = generateCode(11)
                            let hashCode = md5(newCode, 32)
                            let inResult = await insertPasswordChangeCode(email, hashCode)
                            if (inResult === false) {
                                reject({
                                    message: 'Something went wrong',
                                    status: 403
                                })
                            } else {
                                resolve({
                                    message: 'ok',
                                    status: 200,
                                    passwordChangeCode: hashCode,

                                })
                            }
                        } else {
                            reject({
                                message: 'Invalid code',
                                status: 403
                            })
                        }
                    })
                }
            }
        }).catch((err) => {

            reject({
                message: 'Something went wrong',
                status: 403
            })
        })

    }).then((result) => {
        return result
    }).catch((err) => {

        return err
    })
}
exports.verifyPasswordChangerCode = function (code) {
    return new Promise((resolve, reject) => {
        let query = `SELECT * FROM passwordchanger WHERE passwordChangeCode=? ORDER BY timestamp DESC LIMIT 1`
        mysqlConnection.query(query, [code], (err, result) => {
            if (err) reject(false)
            resolve(result)
        })
    }).then((result) => {
        return result
    }).catch((err) => {
        console.log(err);
        return false
    })
}
exports.removeFollower = function (followerId, userId) {

    return new Promise((resolve, reject) => {
        let query = `DELETE FROM followers WHERE followed_by=? AND followed_to=?`
        mysqlConnection.query(query, [followerId, userId], (err, result) => {
            if (err) reject(false)
            resolve(true)
        })
    }).then((result) => {
        return result
    }).catch((err) => {
        return false
    })



}
exports.getPostCount = function (userId) {
    let query = `SELECT COUNT(*) as count FROM post WHERE userId=?`
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [userId], (err, result) => {
            if (err) reject(false)
            resolve(result[0].count)
        })
    }).then((result) => {
        return result
    }).catch((err) => {
        return false
    })

}

const getPostDetails = function (postId, userId) {
    let getThePost = `
    SELECT * FROM post INNER JOIN insta_media ON post.postId=insta_media.postId WHERE post.postId=? AND post.userId=?;
    `
    return new Promise((resolve, reject) => {
        mysqlConnection.query(getThePost, [postId, userId], (err, result) => {
            if (err) reject(false)
            resolve(result)
        })
    }).then((result) => result).catch((err) => false)
}
exports.getPostDetails = getPostDetails;

const insertDeletedPost = async function (postId, userId) {
    let data = await getPostDetails(postId, userId)
    if (data === false) {
        return
    }
    return new Promise((resolve, reject) => {
        mysqlConnection.beginTransaction((err) => {
            if (err) {
                console.log(err);
                mysqlConnection.rollback(function () {
                    reject(false)
                })
            } else {
                if (data.length > 0) {
                    let d = data[0]
                    //postId	postUrl	userId		caption	
                    let query = `INSERT INTO deleted_post(postId,postUrl,userId,timestamp,caption) 
                    VALUES(?,?,?,?,?)
                    `
                    let timestamp = new Date().getTime()
                    mysqlConnection.query(query, [d.postId, d.postUrl, d.userId, timestamp, d.caption], (err, result) => {
                        if (err) {
                            console.log(err);
                            mysqlConnection.rollback(function () {
                                reject(false)
                            })

                        } else {
                            let postId = result.insertId

                            let success = 0
                            for (let index = 0; index < data.length; index++) {
                                //postId	mimeType	url
                                let query = `
                                INSERT INTO deleted_media(postId,mimeType,url) 
                                VALUES(?,?,?)
                                `
                                mysqlConnection.query(query, [postId, data[index].mimetype, data[index].url], (err, result) => {
                                    if (err) {
                                        console.log(err);
                                        mysqlConnection.rollback(function () {
                                            reject(false)
                                        })
                                    }
                                    success += 1

                                    if (data.length === success) {
                                        console.log("Commit");
                                        mysqlConnection.commit((err) => {
                                            console.log("Commit");
                                            if (err) {
                                                console.log(err);
                                                mysqlConnection.rollback(function (err) {
                                                    reject(false)
                                                })
                                            } else {
                                                resolve(true)
                                            }
                                        })
                                    }

                                })
                            }
                        }

                    })
                }
            }



        })



    }).then((result) => result).catch((err) => {
        console.log(err);
        return false
    })
}

exports.insertDeletedPost = insertDeletedPost
exports.deletePost = async function (postId, userId) {

    let result = await insertDeletedPost(postId, userId)
    console.log(result);
    if (result === false) {
        return false
    }
    return new Promise((resolve, reject) => {
        let deleteQ = `
       DELETE p,i FROM post p 
       INNER JOIN insta_media i ON p.postId=i.postId 
       where p.postId=? AND p.userId=?
       `

        mysqlConnection.query(deleteQ, [postId, userId], (err, result) => {
            if (err) reject(false)

            resolve(true)
        })

    }).then((result) => result).catch((err) => false)

}
