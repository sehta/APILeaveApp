var express = require('express');
var router = express.Router();


router.route('/').get(function (req, res) {
    res.send("Welcome to Orion Leave Management APIs");
});




module.exports = router;


