var mail=require('nodemailer')
var smtpTransport=mail.createTransport({
    service:'gmail',
    auth:{
        user:'testinstagram530@gmail.com',
        pass:'TestInsta'
    }
})
exports.sendMail=function(email,subject,message){
    return new Promise(function(resolve,reject){
        var mailOptions={
            from:'"Instagram Clone" <testinstagram530@gmail.com>',
            to:email,
            subject:subject,
            html:message,
            
        }
        smtpTransport.sendMail(mailOptions,function(err,result){
            console.log(err);
            if(err){
                reject(false)

            }else{
                resolve(result)
            }
        })
    }).catch(err=>{
       
        return false
    }).then(res=>res)
}