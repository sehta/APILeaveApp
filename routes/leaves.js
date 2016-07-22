var express = require('express');
var router = express.Router();
var mongojs = require('mongojs')
var config = require('../config'); // get our config file
var db = mongojs(config.database);
var leavecollection = db.collection('leave');
var usercollection = db.collection('user');
var ObjectId = require('mongojs').ObjectID;




function getDeviceToken(id, callbackFunction)
{
    usercollection.findOne({ '_id': new ObjectId(id) }, function (err, user) {
        if (user) {
            return callbackFunction.call(this, user.devicetoken);
        }
        return callbackFunction.call(this, "");
    });
}


// insert leave
router.route('/leave').post(function (req, res) {
    if (!req.body.employeeid) {
        return res.send({ "status": "Error", "message": "missing a parameter" });
    }
    else {

        var myleavecollection = {
            employeeid: req.body.employeeid,
            leavetypeid: req.body.leavetypeid,
            employeename: "",
            duration: req.body.duration,
            joiningdate: new Date(req.body.joiningdate),
            leavefromdate: new Date(req.body.leavefromdate),
            leavetodate: new Date(req.body.leavetodate),
            department: req.body.department,
            contactnumber: req.body.contactnumber,
            approverid: req.body.approverid,
            approvername: "",
            attachment: req.body.attachment,
            geolocation: req.body.geolocation,
            status: req.body.status,
            requestdate: new Date(),
            reason: req.body.reason,
            comments: req.body.comments,
            leavefromtime: req.body.leavefromtime,
            leavetotime: req.body.leavetotime,
            noofdays: req.body.noofdays,
        }

        
                usercollection.findOne({ '_id': new ObjectId(req.body.employeeid) }, function (err, user) {
                    if (user) {
                        myleavecollection.employeename = user.firstname + ' ' + user.lastname;

                        usercollection.findOne({ '_id': new ObjectId(req.body.approverid) }, function (err, appuser) {
                            if (appuser) {
                                myleavecollection.approvername = appuser.firstname + ' ' + appuser.lastname;
                            } else {
                                myleavecollection.approvername = "";
                            }

                            leavecollection.save(myleavecollection, function (err, leave) {
                                if (err) return res.send({ "status": "Error", "message": err });
                                else {

                                    return res.send({ "status": "Success", "message": "leave saved successfully", "approverdevicetoken": appuser.devicetoken, "userdevicetoken": user.devicetoken, "leaveid": leave._id });


                                }
                            });
                        });


                    } else {
                       // myleavecollection.employeename = "";
                   
                        return res.send({ "status": "Error", "message": "User not exist " + req.body.employeeid, "user": user, "state":req.body.state });
                    
                    }
                    
                });


    }
});

// get  employee leaves or by status
router.route('/leaves').post(function (req, res) {
    if (!req.body.employeeid) {
        return res.send({ "status": "Error", "message": "missing a parameter" });
    }
    if (!req.body.status) {
        leavecollection.find({ $query: { 'employeeid': req.body.employeeid }, $orderby: { requestdate: -1 } }, function (err, leave) {
            if (leave) {
                leave.forEach(function (err, item) {
                    if (leave[item].leavetypeid == 1)
                        leave[item].leavetype = "Sick";
                    else
                        leave[item].leavetype = "Casual";

                    if (leave[item].duration == 1)
                        leave[item].duration = "Full leave";
                    else if (leave[item].duration == 2)
                        leave[item].duration = "Half leave";
                    else if (leave[item].duration == 3)
                        leave[item].duration = "short leave";

                });
            }
            return res.send({ "status": "Success", "message": "leave list", "leaves": leave });
        });
    }
    else {
        var startDate = new Date();
        startDate.setHours(0);
        startDate.setMinutes(0);
        startDate.setSeconds(0);

        


        leavecollection.find({ $query: { 'employeeid': req.body.employeeid, 'leavetodate': { $gte: startDate }, 'status': req.body.status }, $orderby: { requestdate: -1 } }, function (err, leave) {
            if (leave) {
                leave.forEach(function (err, item) {
                    if (leave[item].leavetypeid == 1)
                        leave[item].leavetype = "Sick";
                    else
                        leave[item].leavetype = "Casual";

                    if (leave[item].duration == 1)
                        leave[item].duration = "Full leave";
                    else if (leave[item].duration == 2)
                        leave[item].duration = "Half leave";
                    else if (leave[item].duration == 3)
                        leave[item].duration = "short leave";
                });
                return res.send({ "status": "Success", "message": "leave list", "leaves": leave, "currentdate": startDate });
            }
        });
    }

});


// get  employee leaves by approverid or by status
router.route('/requests').post(function (req, res) {
    var startDate = new Date();
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);

    if (!req.body.approverid) {
        return res.send({ "status": "Error", "message": "missing a parameter" });
    }
    if (!req.body.status) {
        leavecollection.find({ $query: { 'approverid': req.body.approverid, 'leavetodate': { $gte: startDate } }, $orderby: { Requestdate: -1 } }, function (err, leave) {
            if (leave) {
                leave.forEach(function (err, item) {
                    if (leave[item].leavetypeid == 1)
                        leave[item].leavetype = "Sick";
                    else
                        leave[item].leavetype = "Casual";

                    if (leave[item].duration == 1)
                        leave[item].duration = "Full leave";
                    else if (leave[item].duration == 2)
                        leave[item].duration = "Half leave";
                    else if (leave[item].duration == 3)
                        leave[item].duration = "short leave";

                });
            }
            return res.send({ "status": "Success", "message": "leave list", "leaves": leave });
        });
    }
    else {
        leavecollection.find({ $query: { 'approverid': req.body.approverid, 'status': req.body.status, 'leavetodate': { $gte: startDate } }, $orderby: { Requestdate: -1 } }, function (err, leave) {
            if (leave) {
                leave.forEach(function (err, item) {
                    if (leave[item].leavetypeid == 1)
                        leave[item].leavetype = "Sick";
                    else
                        leave[item].leavetype = "Casual";

                    if (leave[item].duration == 1)
                        leave[item].duration = "Full leave";
                    else if (leave[item].duration == 2)
                        leave[item].duration = "Half leave";
                    else if (leave[item].duration == 3)
                        leave[item].duration = "short leave";
                });
                return res.send({ "status": "Success", "message": "leave list", "leaves": leave });
            }
        });
    }

});

// get leave by leave id
router.route('/leaves/:id').get(function (req, res) {
    if (!req.params.id) {
        return res.send({ "status": "Success", "message": "missing a parameter", "id": req.params.id });
    }
    leavecollection.findOne({ '_id': new ObjectId(req.params.id) }, function (err, leave) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!leave) {
            return res.send({ "status": "Error", "message": "leave not found", "leave": leave });
        }
        else {

            if (leave) {

                if (leave.leavetypeid == 1)
                    leave.leavetype = "Sick";
                else
                    leave.leavetype = "Casual";

                if (leave.duration == 1)
                    leave.duration = "Full leave";
                else if (leave.duration == 2)
                    leave.duration = "Half leave";
                else if (leave.duration == 3)
                    leave.duration = "short leave";
                usercollection.findOne({ '_id': new ObjectId(leave.employeeid) }, function (err, user) {
                    if (user) {
                        leave.empcode = user.empcode;
                        return res.send({ "status": "Success", "message": "leave found by leave id", "leave": leave });
                    }
                });
            }

        }
    });
});


router.route('/allstats').get(function (req, res) {
    try {
        usercollection.find().sort({ firstname: 1 }, function (err, user) {
            if (err) return res.send({ "status": "Error", "message": err });
            if (user) {
                user.forEach(function (err, uitem) {
                    var pendingLeaves = 0;
                    var usedLeaves = 0;
                    var totalleaves = 0;
                    totalleaves = (user[uitem].leaves[0].numberofleave - 0) + (user[uitem].leaves[1].numberofleave - 0);
                    var uempid = user[uitem]._id.toString();
                    leavecollection.find({ employeeid: uempid }, function (lerr, leave) {
                          if (leave) {
                            leave.forEach(function (err, item) {
                                if (leave[item].status == "pending") {
                                    if (leave[item].duration == 1) {
                                        var pendngleavedays = 0;
                                        if (typeof leave[item].noofdays != 'undefined' && leave[item].noofdays != null) {
                                            pendngleavedays = leave[item].noofdays + 1;
                                        }
                                        pendingLeaves += pendngleavedays;
                                    }
                                    else if (leave[item].duration == 2)
                                        pendingLeaves += .5;
                                    else
                                        pendingLeaves += .25;
                                }
                                else if (leave[item].status == "approved") {
                                    if (leave[item].duration == 1) {
                                        var approvedleavesdays = 0;
                                        if (typeof leave[item].noofdays != 'undefined') {
                                            approvedleavesdays = leave[item].noofdays + 1;
                                        }
                                        usedLeaves += approvedleavesdays;
                                        //   usedLeaves += 1;
                                    }

                                    else if (leave[item].duration == 2)
                                        usedLeaves += .5;
                                    else
                                        usedLeaves += .25;
                                }

                            });
                        }
                        user[uitem].remainingLeaves = (totalleaves) - (usedLeaves + pendingLeaves);
                        user[uitem].pendingLeaves = pendingLeaves;
                        user[uitem].usedLeaves = usedLeaves;
                        user[uitem].totalleaves = totalleaves;

                        if (user.length == (uitem - 0) + (1 - 0))
                            return res.send({ "status": "Success", "message": "User list", "users": user });

                    });

                });
            }
            // return res.send({ "status": "Success", "message": "User list", "users": user });
        });

    } catch (e) {
        return res.send({ "status": "Error", "message": e, "users": [] });
    }
  
});



// get stats by employee id
router.route('/stats/:id').get(function (req, res) {
    if (!req.params.id) { return res.send({ "status": "Error", "message": "missing a parameter", "id": req.params.id }); }

    usercollection.findOne({ '_id': new ObjectId(req.params.id) }, function (err, user) {
        if (user) {
            console.log(user)
            var totalLeaves = 0;
            if (user.leaves != null) {
                user.leaves.forEach(function (err, leave) {
                    totalLeaves += (user.leaves[leave].numberofleave - 0);
                });
            }
            var usedLeaves = 0, remainingLeaves = 0;
            var pendingLeaves = 0;

            leavecollection.find({ employeeid: req.params.id }, function (err, leave) {
                var rejectcount = 0;
                console.log('leave-------------entry-------')
                if (leave != null) {
                    console.log(leave)
                    leave.forEach(function (err, item) {
                        if (leave[item].status == "pending") {
                            if (leave[item].duration == 1)
                            {
                                var pendngleavedays = 0;
                                if (typeof leave[item].noofdays != 'undefined' && leave[item].noofdays != null)
                                {
                                    pendngleavedays = leave[item].noofdays + 1;
                                }
                                pendingLeaves += pendngleavedays;
                            }
                            else if (leave[item].duration == 2)
                                pendingLeaves += .5;
                            else
                                pendingLeaves += .25;
                        }
                        else if (leave[item].status == "approved") {
                            if (leave[item].duration == 1)
                            {
                                var approvedleavesdays = 0;
                                if (typeof leave[item].noofdays != 'undefined')
                                {
                                    approvedleavesdays = leave[item].noofdays + 1;
                                }
                                usedLeaves += approvedleavesdays;
                             //   usedLeaves += 1;
                            }
                                
                            else if (leave[item].duration == 2)
                                usedLeaves += .5;
                            else
                                usedLeaves += .25;

                        }
                        else if (leave[item].status == "rejected")
                        {
                            rejectcount += 1;
                        }
                    });
                }
                remainingLeaves = (totalLeaves) - (usedLeaves + pendingLeaves);
                var leaveStatsCollection =
                {
                    "remainingLeaves": remainingLeaves,
                    "usedLeaves": usedLeaves,
                    "pendingLeaves": pendingLeaves,
                    "rejectedLeaves": rejectcount,
                    "approvalrequests": "0"
                }
                var startDate = new Date();
                startDate.setHours(0);
                startDate.setMinutes(0);
                startDate.setSeconds(0);
                leavecollection.find({ 'approverid': req.params.id, 'status': 'pending', 'leavetodate': { $gte: startDate } }, function (err, approveleave) {
                    console.log('leave-------------entry2222222-------')
                    if (approveleave)
                        leaveStatsCollection.approvalrequests = approveleave.length;
                    return res.send({ "status": "Success", "message": "Leave Stats", "leaveStats": leaveStatsCollection });
                });
            });
        }
        else { return res.send({ "status": "Error", "message": "User not exist " + req.body.id, "user": user }); }
    });
});



// delete leave by id
router.route('/leaves/:id').delete(function (req, res) {
    if (!req.params.id) {
        return res.send({ "status": "Error", "message": "missing a parameter", "id": req.params.id });
    }
    leavecollection.findOne({ '_id': new ObjectId(req.params.id) }, function (err, leave) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!leave) {
            return res.send({ "status": "Error", "message": "leave not found", "leave": leave });
        }
        else {
            leavecollection.remove({ '_id': new ObjectId(req.params.id) }, function (err, results) {
                if (err) return res.send({ "status": "Error", "message": err });
                else {
                    return res.send({ "status": "Success", "message": "Leave deleted successfully", "results": results });
                }
            });
        }
    });
});

// update leave by id
router.route('/leaves/:id').put(function (req, res) {
    if (!req.params.id) {
        return res.send({ "status": "Error", "message": "missing a parameter", "id": req.params.id });
    }
    console.log(req.body.comments);
    console.log(req.body.status);
    console.log(req.params.id);
    leavecollection.findOne({ '_id': new ObjectId(req.params.id) }, function (err, leave) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!leave) {
            return res.send({ "status": "Error", "message": "leave not found", "leave": leave });
        }
        else {
            leavecollection.update({ '_id': new ObjectId(req.params.id) }, { $push: { comments: req.body.comments }, $set: { status: req.body.status } }, function (err, results) {
                if (err) return res.send({ "status": "Error", "message": err });
                else {
                    return res.send({ "status": "Success", "message": "Leave updated successfully", "results": results });
                }
            });
        }
       
    });
});

//  update request by id  cancel/approve/reject/re-apply leave
// also send email here
// pending date time checks
router.route('/updaterequest').post(function (req, res) {
    if (!req.body.id || !req.body.status) {
        return res.send({ "status": "Error", "message": "missing a parameter" });
    }
    /* if(!reason:req.body.reason)
    reason:req.body.reason="";
     */
    if (req.body.status == "pending" && !req.body.comments) {
        return res.send({ "status": "Error", "message": "missing a parameter" });
    }
    leavecollection.findOne({ '_id': new ObjectId(req.body.id) }, function (err, leave) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!leave) {
            return res.send({ "status": "Error", "message": "leave not found", "leave": leave });
        }
        else {

            if (req.body.status == "approved") {
                leavecollection.update({ '_id': new ObjectId(req.body.id) }, {  $set: { status: req.body.status } }, function (err, results) {
                    if (err) return res.send({ "status": "Error", "message": err });
                    else {

                        getDeviceToken(leave.approverid, function (dataApprover) {
                            getDeviceToken(leave.employeeid, function (dataUser) {
                                return res.send({ "status": "Success", "message": "leave " + req.body.status + " successfully", "results": results, "approverdevicetoken": dataApprover, "userdevicetoken": dataUser });
                            });
                        });
                    }
                });
            }
            else {
                leavecollection.update({ '_id': new ObjectId(req.body.id) }, { $push: { "comments": { commentby: req.body.name, comment: req.body.comments, commenton: new Date() } }, $set: { status: req.body.status } }, function (err, results) {
                    if (err) return res.send({ "status": "Error", "message": err });
                    else {

                        getDeviceToken(leave.approverid, function (dataApprover) {
                            getDeviceToken(leave.employeeid, function (dataUser) {
                                return res.send({ "status": "Success", "message": "leave " + req.body.status + " successfully", "results": results, "approverdevicetoken": dataApprover, "userdevicetoken": dataUser });
                            });
                        });
                    }
                });

            }

        }
    });
});

//  forward request  leave
// also send email here
// pending date time checks
router.route('/forwardrequest').post(function (req, res) {
    if (!req.body.id || !req.body.approverid || !req.body.comments || !req.body.name) {
        return res.send({ "status": "Error", "message": "missing a parameter" });
    }
    leavecollection.findOne({ '_id': new ObjectId(req.body.id) }, function (err, leave) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!leave) {
            return res.send({ "status": "Error", "message": "leave not found", "leave": leave });
        }
        else {

            usercollection.findOne({ '_id': new ObjectId(req.body.approverid) }, function (err, user) {
                if (user) {
                    leave.approvername = user.firstname + ' ' + user.lastname;
                    console.log(leave.approvername);
                } else {
                    leave.approvername = "";
                }

                //   $push: { comments: { commentby: req.body.name, comment: req.body.comments, commenton: new Date() } }

                leavecollection.update({ '_id': new ObjectId(req.body.id) }, { $push: { "comments": { commentby: req.body.name, comment: req.body.comments, commenton: new Date() } }, $set: { approvername: leave.approvername, approverid: req.body.approverid } }, function (err, results) {
                    if (err) return res.send({ "status": "Error", "message": err });
                    else {
                        getDeviceToken(leave.approverid, function (dataApprover) {
                            getDeviceToken(leave.employeeid, function (dataUser) {
                                return res.send({ "status": "Success", "message": "leave forwarded successfully", "results": results, "approverdevicetoken": dataApprover, "userdevicetoken": dataUser });
                            });
                        });

                    }
                });
            });
        }
    });
});

module.exports = router;