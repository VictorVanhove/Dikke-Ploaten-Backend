var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

/**
 * Register new user route
 */
router.post('/register', function (req, res, next) {
    //Check request data
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: "ERR_REQUEST_INVALID" });
    }

    let User = mongoose.model('User');
    //Check if there is a user with the given username
    User.findOne({ username: req.body.username }, function (error, user) {
        if (error) {
            return res.status(500).json({ message: "ERR_INTERNAL_SERVER_ERROR" });
        }
        else if (user) {
            return res.status(401).json({ message: "ERR_REGISTER_USERNAME_TAKEN" });
        } else {
            //Register a new user
            let person = new User();
            person.username = req.body.username;
            person.wallet = 0;
            person.setPassword(req.body.password);
            person.save(function (error, user) {
                if (error) {
                    return res.status(500).json({ message: "ERR_INTERNAL_SERVER_ERROR" });
                }
                return res.status(200).json({
                    userID: user.id,
                    username: user.username,
                    wallet: user.wallet
                });
            });
        }
    });
});


/**
 * Login user route
 */
router.post('/login', function (req, res, next) {
    //Check request data
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: "ERR_REQUEST_INVALID" });
    }

    //Find user with given username
    let User = mongoose.model('User');
    User.findOne({ username: req.body.username }, function (error, user) {
        if (error) {
            return res.status(500).json({ message: "ERR_INTERNAL_SERVER_ERROR" });
        }
        //No user with the username or password
        if (!user || !user.validatePassword(req.body.password)) {
            return res.status(401).json({ message: "ERR_LOGIN_INVALID" });
        }
        else {
            return res.status(200).json({
                userID: user.id,
                username: user.username,
                wallet: user.wallet
            });
        }
    });
});


module.exports = router;