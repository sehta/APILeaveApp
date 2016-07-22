var express = require('express');
var router = express.Router();
var mongojs = require('mongojs')
var config = require('../config'); // get our config file
var db = mongojs(config.database);
var User = db.collection('user');
var leavecollection = db.collection('leave');
var ObjectId = mongojs.ObjectID;
var jwt = require('jsonwebtoken');
var bCrypt = require('bcrypt-nodejs');
var smtp = require('../smtp');
var smtpProtocol = smtp.smtpTransport;
var moment = require("moment");
// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
// Generates hash using bCrypt
var createHash = function (password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

router.use(function (req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.param('token') || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, req.app.get('superSecret'), function (err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }

});


router.route('/register').post(function (req, res) {
    if (!req.body.device_token || !req.body.id) {
        return res.send({ "status": "Error", "message": "missing a parameter" });
    }
    else
    {
        User.findOne({ '_id': new ObjectId(req.body.id) }, function (err, user) {
            if (err) return res.send({ "status": "Error", "message": err });
            if (!user) {
                return res.send({ "status": "Error", "message": "User not found", "user": user });
            }
            else {
                User.update({ '_id': new ObjectId(req.body.id) }, { $set: { devicetoken: req.body.device_token} }, function (err, results) {
                    if (err) return res.send({ "message": err });
                    else {
                        return res.send({ "status": "Success", "message": "User Device Token Saved Successfully", "devicetoken": req.body.device_token });
                    }
                });
            }
        });

    }
});



//router.route('/').get(function(req, res) {
//   res.send("Hello ALL USERS");
//});


// insert user
router.route('/user').post(function (req, res) {
    if (!req.body.email || !req.body.password || !req.body.joiningdate) {
        return res.send({ "status": "Error", "message": "missing a parameter" });
    }
    else {
        User.findOne({ 'email': req.body.email }, function (err, user) {
            console.log(user)
            if (!user) {
                var usercollection = {
                    firstname: req.body.firstname,
                    lastname: req.body.lastname,
                    dob: req.body.dob,
                    gender: req.body.gender,
                    empcode: req.body.empcode,
                    email: req.body.email,
                    department: req.body.department,
                    contactnumber: req.body.contactnumber,
                    alternatenumber: req.body.alternatenumber,
                    address: req.body.address,
                    imageurl: req.body.imageurl,
                    createdon: new Date(),
                    lastmodifieddate: new Date(),
                    joiningdate: req.body.joiningdate,
                    password: createHash(req.body.password),
                    roles: req.body.roles,
                    leaves: req.body.leaves,
                    GCMRegToken:req.body.GCMRegToken
                }
                User.save(usercollection, function (err, user) {
                    if (err) return res.send({ "message": err });
                    else {
                        return res.send({ "status": "Success", "message": "User saved successfully" });
                    }
                });

            }
            else {
                return res.send({ "status": "Error", "message": "User already exist with this email id " + req.body.email });
            }
        });
    }
});
// get all users
/* router.route('/users').get(function (req, res) {
    User.find(function (err, user) {
	if (err) return res.send({ "status": "Error","message": err });
        return res.send({ "status": "Success", "message": "User list", "users": user });
    });
}); */


router.route('/specificusers').post(function (req, res) {
    if (!req.body.userid || !req.body.fromdate || !req.body.todate) {
        User.find(function (err, alluser) {
            return res.send({ "status": "Error", "message": "missing a parameter", "users": alluser, "leaves": [] });
        });
    }

    try {
        User.find(function (err, alluser) {
            if (err) return res.send({ "status": "Error", "message": err });
            else {
                User.findOne({ '_id': new ObjectId(req.body.userid) }, function (err, user) {
                    if (user) {
                        console.log(req.body.fromdate)
                        console.log(req.body.todate)
                        var startDate = moment(req.body.fromdate, "DD-MM-YYYY");
                        var endDate = moment(req.body.todate, "DD-MM-YYYY");
                        console.log(startDate)
                        console.log(endDate)
                        startDate.minutes(0);
                        startDate.hours(0);
                        startDate.seconds(0);
                       
                        endDate.minutes(0);
                        endDate.hours(0);
                        endDate.seconds(0);
                        var sdate = startDate.toDate();
                        var edate = endDate.toDate();
                        console.log(sdate)
                        console.log(edate)
                      

                        leavecollection.find({ employeeid: req.body.userid, 'leavetodate': { $gte: sdate, $lte: edate } }, function (err, leave) {
                            return res.send({ "status": "Success", "message": "Leave Stats", "users": alluser, "leaves": leave });
                        });
                    }
                    else { return res.send({ "status": "Error", "message": "User not exist " + req.body.userid, "users": alluser, "leaves": [] }); }
                });

            }

        });
    } catch (e) {
    return res.send({ "status": "Error", "message": e, "users": [], "leaves": [] });
    }
   
});


// get all users or by role
router.route('/users').get(function (req, res) {
    if (!req.query.role) {
        User.find(function (err, user) {
            if (err) return res.send({ "status": "Error", "message": err });
            return res.send({ "status": "Success", "message": "User list", "users": user });
        });
    }
    else {

        if (req.query.role == "approver") {
            User.find({ $or: [{ 'roles': 'admin' }, { 'roles': 'approver' }] }, { '_id': true, 'firstname': true, 'lastname': true, 'devicetoken':true }, function (err, user) {
                if (err) return res.send({ "status": "Error", "message": err });
                if (!user) {
                    return res.send({ "status": "Error", "message": "User not found" });
                }
                else {
                    return res.send({ "status": "Success", "message": "User found by role", "user": user });
                }

            });
        }
        else {
            User.find({ 'roles': req.query.role }, { '_id': true, 'firstname': true, 'lastname': true, 'devicetoken': true }, function (err, user) {
                if (err) return res.send({ "status": "Error", "message": err });
                if (!user) {
                    return res.send({ "status": "Error", "message": "User not found" });
                }
                else {
                    return res.send({ "status": "Success", "message": "User found by role", "user": user });
                }

            });
        }
    }

});

// get user by id
router.route('/users/:id').get(function (req, res) {
    if (!req.params.id) {
        return res.send({ "status": "Error", "message": "missing a parameter", "id": req.params.id });
    }
    User.findOne({ '_id': new ObjectId(req.params.id) }, function (err, user) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!user) {
            return res.send({ "status": "Error", "message": "User not found" });
        }
        else {
            return res.send({ "status": "Success", "message": "User found by user id", "user": user });
        }

    });
});

// delete user by id
router.route('/users/:id').delete(function (req, res) {
    if (!req.params.id) {
        return res.send({ "status": "Error", "message": "missing a parameter", "id": req.params.id });
    }
    User.findOne({ '_id': new ObjectId(req.params.id) }, function (err, user) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!user) {
            return res.send({ "status": "Error", "message": "User not found", "user": user });
        }
        else {
            User.remove({ '_id': new ObjectId(req.params.id) }, function (err, results) {
                if (err) return res.send({ "status": "Error", "message": err });
                else {
                    return res.send({ "status": "Success", "message": "User deleted successfully", "results": results });
                }
            });
        }
    });
});


// delete device token by id
router.route('/user/:id').get(function (req, res) {
    if (!req.params.id) {
        return res.send({ "status": "Error", "message": "missing a parameter", "id": req.params.id });
    }
    User.findOne({ '_id': new ObjectId(req.params.id) }, function (err, user) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!user) {
            return res.send({ "status": "Error", "message": "User not found", "user": user });
        }
        else {
            User.update({ '_id': new ObjectId(req.params.id) }, { $set: { devicetoken: "" } }, function (err, results) {
                if (err) return res.send({ "message": err });
                else {
                    return res.send({ "status": "Success", "message": "User Device Token Updated Successfully" });
                }
            });
        }
    });
});

//update complete user profile
router.route('/updateuser/:id').post(function (req, res) {
    if (!req.params.id) {
        return res.send({ "status": "Success", "message": "missing a parameter", "id": req.params.id });
    }

    var userdetail = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        dob: req.body.dob,
        gender: req.body.gender,
        empcode: req.body.empcode,
        //email: req.body.email,
        department: req.body.department,
        contactnumber: req.body.contactnumber,
        address: req.body.address,
        imageurl: req.body.imageurl,
        lastmodifieddate: new Date(),
        joiningdate: req.body.joiningdate,
       // password: req.body.password,
        roles: req.body.roles,
        leaves: req.body.leaves
    }

    User.findOne({ '_id': new ObjectId(req.params.id) }, function (err, user) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!user) {
            return res.send({ "status": "Error", "message": "User not found", "user": user });
        }
        else {
            User.update({ '_id': new ObjectId(req.params.id) }, { $set: { lastmodifieddate: new Date(), roles: req.body.roles, leaves: req.body.leaves, alternatenumber: req.body.alternatenumber, joiningdate: req.body.joiningdate, firstname: userdetail.firstname, lastname: userdetail.lastname, dob: req.body.dob, gender: req.body.gender, empcode: req.body.empcode, department: req.body.department, imageurl: req.body.imageurl, contactnumber: userdetail.contactnumber, address: userdetail.address } }, function (err, results) {
                if (err) return res.send({ "message": err });
                else {
                    return res.send({ "status": "Success", "message": "User updated successfully", "results": results });
                }
            });
        }
    });
});

// update user by id
router.route('/users/:id').put(function (req, res) {
    if (!req.params.id) {
        return res.send({ "status": "Success", "message": "missing a parameter", "id": req.params.id });
    }

    var userdetail = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        dob: req.body.dob,
        gender: req.body.gender,
        empcode: req.body.empcode,
        //email: req.body.email,
        department: req.body.department,
        contactnumber: req.body.contactnumber,
        address: req.body.address,
        imageurl: req.body.imageurl,
        lastmodifieddate: new Date(),
        joiningdate: req.body.joiningdate,
        password: req.body.password,
        roles: req.body.roles,
        leaves: req.body.leaves
    }

    User.findOne({ '_id': new ObjectId(req.params.id) }, function (err, user) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!user) {
            return res.send({ "status": "Error", "message": "User not found", "user": user });
        }
        else {
            User.update({ '_id': new ObjectId(req.params.id) }, { $set: { contactnumber: req.body.contactnumber, address: req.body.address } }, function (err, results) {
                if (err) return res.send({ "message": err });
                else {
                    return res.send({ "status": "Success", "message": "User updated successfully", "results": results });
                }
            });
        }
    });
});
module.exports = router;


