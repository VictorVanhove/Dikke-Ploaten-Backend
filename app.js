var bodyParser = require('body-parser');
//set port
var port = process.env.PORT || 3000;
var logger = require('morgan');

//configure dotenv
require('dotenv').config();

//mongoose schemas
require('./models/User');
require('./models/Task');
require('./models/Album');

//routes
var users = require('./routes/user');
var tasks = require('./routes/task');
var albums = require('./routes/album');
var index = require('./routes/index');

//init server
var app = require('express')();
const server = require('http').createServer(app);

//config server
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', index);
app.use('/api/users', users);
app.use('/api/tasks', tasks);
app.use('/api/albums', albums);

//Database connection
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_CONNECTION_URL || 'mongodb://localhost:27017/mydb', {
    useNewUrlParser: true,
    useCreateIndex: true
});

//catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//error handler
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json(err.message);
});

server.listen(port, () => console.log(`Listening on port: ${port}`));