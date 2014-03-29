#!/usr/bin/env node
"use strict";

var express = require('express');
var http = require('http');
var path = require('path');

var routes = require('./routes');
var user = require('./routes/user');
var feed = require('./routes/feed');

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
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
app.get('/user/:uid/feeds/new', feed.new);
app.post('/user/:uid/feeds', feed.create);
app.get('/user/:uid/feeds/:fid', feed.show);
app.get('/user/:uid/feeds/:fid/edit', feed.edit);
app.put('/user/:uid/feeds/:fid', feed.update);
app.delete('/user/:uid/feeds/:fid', feed.delete);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
