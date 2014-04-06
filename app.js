#!/usr/bin/env node
"use strict";

var express = require('express'),
    http = require('http'),
    path = require('path'),
    helpers = require('view-helpers'),
    schedule = require('node-schedule');

var routes = require('./routes'),
    user = require('./routes/user'),
    feed = require('./routes/feed');

var env = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env],
    mongoose = require('mongoose');

// Connect to db
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(config.db, options);
};
connect();

// Error handler
mongoose.connection.on('error', function (err) {
  console.error(err);
});

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
  connect();
});

var app = express();
app.locals.moment = require('moment');

schedule.scheduleJob({minute:0}, function() {
  feed.fetch();
});

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(helpers());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// homepage
app.get('/', routes.index);

// user route
app.get('/user/new', user.new);
app.post('/user', user.create);
app.get('/user', user.show);
app.get('/user/edit', user.edit);
app.put('/user', user.update);
app.delete('/user', user.delete);

// feed
app.get('/user/:uid/feeds', feed.index);
app.get('/user/:uid/feeds/refresh', feed.refresh);
app.get('/user/:uid/feeds/new', feed.new);
app.post('/user/:uid/feeds', feed.create);
app.get('/user/:uid/feeds/:fid', feed.index);
app.get('/user/:uid/feeds/:fid/refresh', feed.refresh);
app.get('/user/:uid/feeds/:fid/edit', feed.edit);
app.put('/user/:uid/feeds/:fid', feed.update);
app.delete('/user/:uid/feeds/:fid', feed.delete);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
