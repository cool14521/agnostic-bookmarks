// =============================================================================
//  This file is the entry point of the application
// =============================================================================

/* DEPENDENCIES */
//External packages
var express  = require('express');          // Route management framework
var override = require('method-override');  // PUT, PATCH and DELETE methods
var parser   = require('body-parser');      // Parser for requests' body
var mongoose = require('mongoose');         // MongoDB driver for node
var morgan   = require('morgan');           // Request logger
//var passport = require('passport');
//Internal dependencies
var routes = require("./app/routes");
var config = require("./app/config");


/* SERVER CONFIG */
var app  = express();                 // Initialise express application
var port = process.env.PORT || 3000;  // Read PORT from environment or use 3000
//Middleware setup (order does matter)
app.use(express.static(__dirname + '/public/dist')); // Set frontend files' path
//If we are not testing, set log level to 'dev'
if (process.env.NODE_ENV != 'test') { app.use(morgan('dev')); }
app.use(parser.json());
app.use(parser.urlencoded({'extended': 'false'}));
app.use(parser.json({ type: 'application/vnd.api+json' }));
app.use(override());
//app.use(passport.initialize());
//Routes setup (order does matter)
app.use(routes);

/* DEFINE STARTUP AND SHOTDOWN FUNCTIONS */
var server;
function start() {
    mongoose.connect(config.database);  // Connect to database through mongoose
    server = app.listen(port, function() {  // Start server activity
        console.log("Something beautiful is happening on port " + port);
    });
}

function close() {
    mongoose.connection.close(function() {
        console.log('Terminating mongoose connection');
    });
    console.log('Shutting down the server');
    server.close();
};

module.exports = {
    start: start,
    close: close
}

/* SERVER START */
start();
