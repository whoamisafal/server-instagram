const mysqlConnection = require('./dbconnection');

class MessageStructure {
    constructor(messageId = 0, senderId, receiverId, message, timestamp, type, status, messageReference, message_delete_sender, message_delete_receiver) {
        this.messageId = messageId;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.message = message;
        this.timestamp = timestamp;
        this.type = type;
        this.status = status;
        this.messageReference = messageReference;
        this.message_delete_sender = message_delete_sender;
        this.message_delete_receiver = message_delete_receiver;
    }
}
exports = module.exports = MessageStructure;

exports.sendMessage = function (messageStructure) {

    if (messageStructure instanceof MessageStructure) {
        new Promise(function (resolve, reject) {
            let query = "INSERT INTO chat(senderId,receiverId,message,timestamp,type,isSeen,messageReference,message_delete_sender,message_delete_receiver) VALUES(?,?,?,?,?,?,?,?,?)";
            let values = [messageStructure.senderId, messageStructure.receiverId, messageStructure.message, parseInt(messageStructure.timestamp), messageStructure.type, messageStructure.status, messageStructure.messageReference, messageStructure.message_delete_sender, messageStructure.message_delete_receiver];
            mysqlConnection.query(query, values, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        }).then(function (result) {
            return result;
        }).catch(function (err) {
            return false;
        });
    } else {
        throw new Error("Invalid Message Structure");
    }
}


exports.getChatMessages = function (senderId, receiverId) {
    return new Promise(function (resolve, reject) {
        let query = "SELECT user.username,user.profile,chat.cid,chat.senderId,chat.receiverId,chat.timestamp,chat.message,chat.type,chat.isSeen,chat.messageReference,chat.message_delete_sender,chat.message_delete_receiver FROM chat INNER JOIN user ON receiverId=user.userId  WHERE (senderId=? AND receiverId=?) OR (senderId=? AND receiverId=?) ORDER BY timestamp ASC";
        let values = [senderId, receiverId, receiverId, senderId];
        mysqlConnection.query(query, values, function (err, result) {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    }).then(function (result) {
        return result;
    }).catch(function (err) {
        return false;
    });
}
exports.getMessageRequestCount = function (userId) {

    let selectQ = `SELECT DISTINCT count(*) as count FROM initconversation WHERE receiverId=? AND isAccept=?`
    return new Promise((resolve, reject) => {

        mysqlConnection.query(selectQ, [userId, 0], (err, result) => {
            if (err) reject(false)
            resolve(result)
        })


    }).then((result) => result)
        .catch((err) => {

            return false
        })
}

exports.getAllMessageRequests = function (userId) {

    let query = `
    SELECT DISTINCT  u.userId,u.username,u.profile,u.fullname,i.id from user u inner join initconversation i ON 
    u.userId=i.senderId where u.userId in(SELECT DISTINCT senderId from initconversation where receiverId=? AND isAccept=?)
    `
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [userId,0], (err, result) => {
            if (err) reject(false)
            resolve(result)
        })

    }).then((result) => result)
        .catch((err) => false)


}
exports.acceptChatRequest = function (ichatid, cuid, isAccept, userId) {

    let query = `
    UPDATE initconversation set isAccept=? where id=? AND senderId=? AND receiverId=?
    `
    return new Promise((resolve, reject) => {
        mysqlConnection.query(query, [
            isAccept,
            ichatid,
            cuid,
            userId
        ], (err, result) => {
            if (err) reject(false)
            resolve(result)
        })
    }).then((result) => result)
        .catch((err) => false)


}

exports.ignoreChat=function(senderId,receiverId,isIgnore,isAccept){


    return new Promise((resolve,reject)=>{

        mysqlConnection.beginTransaction((err)=>{
            if(err)reject(false)

            let query=`
            UPDATE initconversation set isAccept=? where  senderId=? AND receiverId=?
            `
            mysqlConnection.query(query,[isAccept,senderId,receiverId],(err,result)=>{
                if(err)reject(false)

            })
            let query1=`
            UPDATE initconversation set isIgnore=? where  senderId=? AND receiverId=?
            `
            mysqlConnection.query(query1,[isIgnore,senderId,receiverId],(err,result)=>{
                if(err)reject(false)
            })
            mysqlConnection.commit((err)=>{
                if(err){
                    mysqlConnection.rollback()
                    reject(false)
                }
                resolve(true)
            })
        })



    }).then((result)=>result)
    .catch((err)=>false)


}