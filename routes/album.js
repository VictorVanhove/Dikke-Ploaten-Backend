var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

let Album = mongoose.model('Album');

router.get('/', function (req, res) {
    Album.find({}).exec(function (err, result) {
        if (!err) {
            res.end(JSON.stringify(result, undefined, 2));
        } else {
            res.end('Error:' + err);
        }
    })
});

module.exports = router;