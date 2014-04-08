#!/usr/bin/env node
"use strict";

var mongo = require("mongodb").MongoClient;

//LL - Check if the desired username already exists
function doesUserExist(req, res, callback){
	var post = req.body;

	mongo.connect("mongodb://localhost:27017/grra_dev", function(err, db){
		if(err) { return console.dir(err); }

		var collection = db.collection("users");
		collection.find({username: post.username}).count(function(err, count){
			if (count > 0){
				//username already exists
				res.redirect("/");
			}
			else{
				//username does not exist, create it
				callback(req);
				res.redirect("/user/");
			}
		});
	});
}

//LL - Create the user 
function createUser(req){
	var post = req.body;

	//connect to db server
	mongo.connect("mongodb://localhost:27017/grra_dev", function(err, db){
		if(err) { return console.dir(err); }
		
		var collection = db.collection("users");
		collection.insert({username: post.username, password : post.password}, function(error, doc){});
	});

	return;
}

//LL - Attempt to log user in and create session cookie
function authenticateUser(req, res){
	var post = req.body;

	mongo.connect("mongodb://localhost:27017/grra_dev", function(err, db){
		if(err) { return console.dir(err); }

		var collection = db.collection("users");
		collection.find({username: post.username, password: post.password}).count( function( err, count ){
			if (count === 1) {
				console.log("USER: '" + post.username + "' successfully authenticated");
				req.session.uid = post.username;
				res.redirect("/");
			} 
			else {
				console.log("USER: '" + post.username + "'" + " invalid credentials");
				res.redirect("/user/login");
			}
		});
	});
}

//LL - called on 'user/new' GET
exports.new = function(req, res) {
	res.render("user_new", { title: "GRRA | Create a new account" });
};

//LL - called on 'user/new' POST
exports.create = function(req, res) {
	doesUserExist(req, res, createUser);
};

//LL - serves login page
exports.showLogin = function(req, res){
	res.render("login", {title:"GRRA | User Login"});
};

//LL - attempts to authenticate user
exports.login = function(req, res) {
	authenticateUser(req, res);
};

//LL - check if user is authenticated, proceed if true. Use this callback for proceeding to authenticated pages
exports.isAuthenticated = function(req, res, next){
	//user is trying to access protected page
	if (!req.session.uid) {
		console.log("UNATHENTICATED ATTEMPT");
		res.redirect("/user/login");
	}
	//authenticated user, proceed
	else {
		next();
	}
}

//LL - logout, destroy auth cookie
exports.logout = function(req, res){
	delete req.session.uid;
	res.redirect("/user/login");
}

exports.login = function(req, res) {
	res.send("user.login");
};

exports.show = function(req, res) {
  res.send("user.show");
};

exports.edit = function(req, res) {
  res.send("user.edit");
};

exports.update = function(req, res) {
  res.send("user.update");
};

exports.delete = function(req, res) {
  res.send("user.delete");
};