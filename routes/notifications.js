var express = require('express');
var router = express.Router();
var gcm = require('node-gcm');
var mongojs = require('mongojs')
var config = require('../config'); // get our config file
var db = mongojs(config.database);
var settingcollection = db.collection('setting');
var leavecollection = db.collection('leave');
var ObjectId = require('mongojs').ObjectID;

// Set up the sender with you API key, prepare your recipients' registration tokens.
var gcmapikey = '';
settingcollection.findOne({ 'settingkey': 'gcmapikey' }, function (err, setting) {
    if (err) console.log(err);
    if (!setting) {
        console.log('gcm api key not found');
       // return res.send({ "status": "Error", "message": "gcm api key not found" });
    }
    else {
         gcmapikey = setting.settingvalue;
      //  gcmapikey = "AIzaSyCaPjebeZXRG6XJ0_bnq7kJulydk9iZaVs";
    }

});
var sender = new gcm.Sender(gcmapikey);
//var regID = gcm.register('214485254187');
//console.log(regID);
//var regTokens = ['YOUR_REG_TOKEN_HERE'];

router.route('/notifications').post(function (req, res) {
    try {
        if (!req.body.message || !req.body.GCMRegToken || !req.body.leaveid || !req.body.state) {
            return res.send({ "status": "Error", "message": "missing a parameter", "state": req.body.state });
        }
        else {
            console.log('gcmapikey: ' + gcmapikey);

            try {

                
                var regTokens = [];
                var gcmArray = req.body.GCMRegToken;
                console.log(gcmArray)
                console.log('gcmArray')
                gcmArray.forEach(function (token) {
                    console.log(token)
                    console.log('token')
                    regTokens.push(token);
                });
                

                var retry_times = 4; //the number of times to retry sending the message if it fails

                var message = new gcm.Message({
                    notification: {
                        title: "Hello, World",
                        icon: "ic_launcher",
                        body: "This is a notification that will be displayed ASAP."
                    }
                }); //create a new message
  
                //var setMessage = new Object();
                //setMessage.message = req.body.message;
                //setMessage.state = req.body.state;
                //setMessage.leaveid = req.body.leaveid;
                //var jsonString = JSON.stringify(setMessage);

              //  message.addData('message', jsonString);

                message.addData('title', 'Applied Leave');
                message.addData('message', req.body.message);
                message.addData('sound', 'notification');

                message.addData('state', req.body.state);
                message.addData('leaveid', req.body.leaveid);

                message.collapseKey = 'testing'; //grouping messages
                message.delayWhileIdle = true; //delay sending while receiving device is offline

                message.state = req.body.state
                message.leaveid = req.body.leaveid;

              //  message.timeToLive = 3; //the number of seconds to keep the message on the server if the device is offline
                
                /*
                YOUR TODO: add code for fetching device_token from the database
                */

             


                var sender = new gcm.Sender('AIzaSyADrAdtzmcc-10uiy_AkQ5mQx75u2crscU');
                leavecollection.findOne({ '_id': new ObjectId(req.body.leaveid) }, function (lerr, leave) {
                    console.log(leave.approverid)
                    if (lerr)
                          return res.send({ "status": "Error", "message": lerr });
                    if (leave) {
                        console.log(leave.approverid);
                        message.addData('approverid', leave.approverid);
                        message.approverid = leave.approverid;
                        
                        sender.send(message, {
                            registrationTokens: regTokens
                        }, retry_times, function (err, response) {
                            if (err) {
                                console.error('Error : ' + err);
                                return res.send({ "status": "Error", "message": err.toString(), "state": req.body.state });
                            }
                            else {
                                console.log('response' + response);
                                return res.send({ "status": "Success", "message": "notification sent successfully", 'response': response, 'error': err, "state": req.body.state, "leaveid": req.body.leaveid });
                            }
                        });
                        //  return res.send({ "status": "Error", "message": "leave not found", "leave": leave });
                    }
                });

                




                //sender.send(message, {
                //    registrationTokens: regTokens
                //}, function (err, response) {
                //    if (err) {
                //        console.error('Error : ' + err);
                //        return res.send({ "status": "Error", "message": err.toString() });
                //    }
                //    else {
                //        console.log('response' + response);
                //        return res.send({ "status": "Success", "message": "notification sent successfully", 'response': response, 'error': err });
                //    }
                //});

            } catch (e) {
                res.send({ "status": "Error", "message": 'sender.send method error', 'error': err, "state": req.body.state });
            }
            
        }
    } catch (err) {
        res.send({ "status": "Error", "message": 'System error', 'error': err, "state": req.body.state });
    }
    
});

//router.route('/notifications').get(function (req, res) {
//    sender.send(message, { registrationTokens: regTokens }, function (err, response) {
//        if (err) console.error(err);
//        else console.log(response);
//    });
//    res.send(response);
//});




module.exports = router;


