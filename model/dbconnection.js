var mysql=require('mysql')
//H)U@<NFX264!gW#6
var mysqlConnection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'db_instagram',
    multipleStatements:true
})
mysqlConnection.connect(function(err){
    if(!err){
        console.log("Connected");
    }else{
        console.log("Connection failed");
    }
})
module.exports=mysqlConnection;









