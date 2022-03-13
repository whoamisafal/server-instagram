
var mysqlConnection=require('./dbconnection');

exports.search=function(q){

    return new Promise(function(resolve,reject){

        let qd=q+"%"
        let qd1=q

        var sql="SELECT userId,username,fullname,profile FROM user WHERE username LIKE ? || fullname LIKE ?";
        mysqlConnection.query(sql,[
            qd,
            qd1
        ],function(err,result){
            if(err){
                reject(err)
            }else{
                resolve(result)
            }
        })
    })


}

exports.explore=function(userId,limit,offset){

    return new Promise(function(resolve,reject){
       
        var sql="SELECT user.userId,username,fullname,profile,userinfo.account_visiblity FROM user INNER JOIN userinfo ON user.userId=userinfo.userId WHERE user.userId not IN (SELECT followed_to FROM followers WHERE followed_by=?) AND  user.userId!=? LIMIT ? OFFSET ?";
        mysqlConnection.query(sql,[
            parseInt(userId),
        parseInt(userId),
         parseInt(limit),
         parseInt(offset)
        ],function(err,result){
            console.log(result);
            if(err){
                reject(err)
            }else{
                resolve(result)
            }
        })
    })


}

exports.MaxUser=function () {
    return new Promise(function(resolve,reject){

        var sql="SELECT count(*) as len FROM user";
        mysqlConnection.query(sql,function(err,result){
            if(err){
                reject(err)
            }else{
             
                resolve(result[0].len)
            }
        })
    })
    
}
