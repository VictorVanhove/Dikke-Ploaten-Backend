var express = require('express');
var router = express.Router();

router.get('/ping', function (req, res, next) {
    return res.status(200).send("Server is now running.");
});

module.exports = router;