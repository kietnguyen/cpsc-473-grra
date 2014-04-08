#!/usr/bin/env node
"use strict";

var mongo = require("mongodb").MongoClient;

//LL - Check if the desired username already exists
function DoesUserExist(req, res, callback){//(req, res){
	var post = req.body;

	mongo.connect("mongodb://localhost:27017/grra_dev", function(err, db){
		if(err) { return console.dir(err); }

		var collection = db.collection("users");
		collection.find({username: post.username}).count(function(err, count){
			if (count > 0){
				res.redirect("/");
			}
			else{
				callback(req);
				res.redirect("/user");
			}
		});
	});
}

//LL - Create the user 
function CreateUser(req){//(req, res){
	var post = req.body;

	//connect to db server
	mongo.connect("mongodb://localhost:27017/grra_dev", function(err, db){
		if(err) { return console.dir(err); }
		
		var collection = db.collection("users");
		collection.insert({username: post.username, password : post.password}, function(error, doc){});
	});

	return;
}

//LL - called on 'user/new' GET
exports.new = function(req, res) {
	res.render("user_new", { title: "GRRA | Create a new account" });
};

//LL - called on 'user/new' POST
exports.create = function(req, res) {
	DoesUserExist(req, res, CreateUser);
};

exports.showLogin = function(req, res){
	res.render("login", {title:"GRRA | User Login"});
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