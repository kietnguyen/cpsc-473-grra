#!/usr/bin/env node
"use strict";

var mongo = require("mongodb").MongoClient;

//LL - Check if the desired username already exists
function DoesUserExist(req, res){
	var post = req.body;

	mongo.connect("mongodb://localhost:27017/grra_dev", function(err, db){
		if(err) { return console.dir(err); }

		var collection = db.collection("users");
		collection.find({username: post.username}).count( function( err, count ){
			if (count > 0){
				console.log(count);
				return true; //already exists
			}
			else{
				console.log(count);
				return false; //does not exist
			}
		});
	});
}

//LL - Create the user 
function CreateUser(req, res){
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
	var exists = DoesUserExist(req, res);
	console.log(exists);
	if (exists === true){
		console.log("exists");
		res.redirect('/user/new');
	}
	else{
		//good to create user since it does not exist yet
		CreateUser(req, res);
		console.log("does not");
		res.redirect('/user/new');
	}
  	//res.send("user.create");
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