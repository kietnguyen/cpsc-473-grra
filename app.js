#!/usr/bin/env node
"use strict";

var express = require("express"),
    http = require("http"),
    path = require("path");

var routes = require("./routes"),
    user = require("./routes/user"),
    feed = require("./routes/feed");

var env = process.env.NODE_ENV || "development",
    config = require("./config/config")[env],
    mongoose = require("mongoose");

// Connect to db
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(config.db, options);
};
connect();

// Error handler
mongoose.connection.on("error", function (err) {
  console.error(err);
});

// Reconnect when closed
mongoose.connection.on("disconnected", function () {
  connect();
});

var app = express();
app.locals.moment = require("moment");

var intervalMinutes = 15 * 60 * 1000;
setInterval(function(err) {
  if (err) { console.error(err); }

  console.log("Refresh all ... ");
  feed.refreshAll();
}, intervalMinutes);

// all environments
app.set("port", process.env.PORT || 8080);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use(express.favicon());
app.use(express.logger("dev"));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret:"$ecreT"}));
app.use(app.router);
app.use(express.static(path.join(__dirname, "public")));

// development only
if ("development" === app.get("env")) {
  app.use(express.errorHandler());
}

// homepage
app.get("/", routes.index);

// user route
app.get("/user/login", user.showLogin);
app.get("/user/login/:status", user.showLogin);
app.post("/user/login", user.login);
app.get("/user/signup", user.new);
app.get("/user/signup/:status", user.new);
app.post("/user/signup", user.create);
app.get("/user/logout", user.isAuthenticated, user.logout);
app.get("/user", user.isAuthenticated, user.show); //preliminary test for navigating to authenticated pages
app.get("/user/edit", user.isAuthenticated, user.getupdate);
app.post("/user/update", user.isAuthenticated, user.update);
app.delete("/user", user.delete);

// feed
app.get("/user/:uid/feeds", user.isAuthenticated, feed.index);
app.get("/user/:uid/feeds/refresh", user.isAuthenticated, feed.refresh);
app.get("/user/:uid/feeds/new", user.isAuthenticated, feed.new);
app.post("/user/:uid/feeds", user.isAuthenticated, feed.create);
app.get("/user/:uid/feeds/:fid", user.isAuthenticated, feed.index);
app.get("/user/:uid/feeds/:fid/refresh", user.isAuthenticated, feed.refresh);
app.get("/user/:uid/feeds/:fid/edit", user.isAuthenticated, feed.edit);
app.post("/user/:uid/feeds/:fid", user.isAuthenticated ,feed.update);
app.delete("/user/:uid/feeds/:fid", user.isAuthenticated, feed.delete);


http.createServer(app).listen(app.get("port"), function(){
  console.log("Express server listening on port " + app.get("port"));
});
