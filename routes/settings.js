var express = require('express');
var router = express.Router();
var mongojs = require('mongojs')
var config = require('../config'); // get our config file
var db = mongojs(config.database);
var mycollection = db.collection('setting');

router.route('/setting').post(function (req, res) {
    if (!req.body.settingkey || !req.body.settingvalue) {
        return res.send({ "status": "Error", "message": "missing a parameter" });
    } 
    else {
        mycollection.findOne({ 'settingkey': req.body.settingkey }, function (err, setting) {
            console.log(setting)
            if (!setting) {

                var settingcollection = {
                    settingkey: req.body.settingkey,
                    settingvalue: req.body.settingvalue
                }
                mycollection.save(settingcollection, function (err, setting) {
               if (err) return res.send({ "message": err });
               else {
                   return res.send({ "status": "Success", "message": "setting saved successfully" });
               }
           });

            }
            else {
                return res.send({ "status": "Error", "message": "setting already exist with this setting key: " + req.body.settingkey });
            }
        });

    }
});

// get setting by setting key
router.route('/settings/:settingkey').get(function (req, res) {
    if (!req.params.settingkey) {
        return res.send({ "status": "Error", "message": "missing a parameter", "settingkey": req.params.settingkey });
    }
    mycollection.findOne({ 'settingkey': req.params.settingkey }, function (err, setting) {
        if (err) return res.send({ "status": "Error", "message": err });
        if (!setting) {
            return res.send({ "status": "Error", "message": "setting key not found" });
        }
        else {
            return res.send({ "status": "Success", "message": "setting found by setting key", "settings": setting });
        }

    });
});
module.exports = router;