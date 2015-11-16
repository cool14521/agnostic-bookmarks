// =============================================================================
//  This file defines the endpoints for the RESTFul API and the routes for the
//  application.
// =============================================================================

var express        = require('express');
var authMiddleware = require('./auth-middleware').basicMiddleware;
var User           = require('./user-model');

/* AUTH HANDLER MIDDLEWARE */
function authRouter(req, res, next) {
    if (req.params.internalError) {
        res.status(500).send(req.params.internalError);
    }
    else if (req.params.user == null) {
        res.status(401).send({"message": "Invalid username or password"});
    }
    else {
        next();
    }
}

/* API ROUTES */
var apiRoutes = express.Router();

//Enable Cross Origin Requests
apiRoutes.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// API entry point
apiRoutes.get('/', function(req, res) {
    res.json('Welcome to the coolest API this side of the Mississippi :D');
});

// Users endpoint
apiRoutes.route('/users')
    // Get a list with all the users
    .get(function(req, res){
        User.find({}, function(err, users){
            res.json(users);
        });
    })
    // Add a new user
    .post(function(req, res){
        new User({
            username: req.body.username,
            password: req.body.password
        }).save(function(err, data){
            if (err) res.status(500).send(err);
            else res.json(data);
        });
    });

// Auth endpoint
apiRoutes.route('/auth')
    .get(authMiddleware, authRouter, function(req, res){
        res.json(req.params.user); 
    });

/* GLOBAL ROUTES */
// API endpoints go under '/api' route. Other routes are redirected to
// index.html where AngularJS will handle frontend routes.
var routes = express.Router();
routes.use('/api', apiRoutes);
routes.get('*', function(req, res) {
    console.log(__dirname);
    res.sendFile('index.html', {'root': 'public/dist'});
});

module.exports = routes;
