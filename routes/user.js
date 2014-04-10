#!/usr/bin/env node
"use strict";

require('../models/user.js');

var mongo = require("mongodb").MongoClient,
    mongoose = require('mongoose'),
    User = mongoose.model('User');

//LL - Check if the desired username already exists
function doesUserExist(req, res, callback){
  var post = req.body;

  mongo.connect("mongodb://localhost:27017/grra_dev", function(err, db){
    if(err) { return console.dir(err); }

    var collection = db.collection("users");
    collection.find({username: post.username}).count(function(err, count){
      if (count > 0){
        //username already exists
        console.log("Signup Error: " + post.username + " already exists");
        res.redirect("/user/signup/error");
      }
      else{
        //username does not exist, create it
        callback(req);
        res.redirect("/user/login/success");
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
  var objectId;

  if (req.session.uid) {
    res.redirect('/user/'+req.session.uid+'/feeds');
  }

  mongo.connect("mongodb://localhost:27017/grra_dev", function(err, db){
    if(err) { return console.dir(err); }

    var collection = db.collection("users");
    collection.findOne({username: post.username, password: post.password},{_id:1}, function(err, doc) {
      if (err) console.error(err);

      if (doc) {
        console.log("USER: '" + post.username + "' successfully authenticated");
        console.dir(doc);
        console.log ("uid is : "+doc._id);
        req.session.uid = doc._id;
        res.redirect('/user/'+doc._id+'/feeds');
      }
      else {
        console.log("USER: '" + post.username + "'" + " invalid credentials");
        res.redirect("/user/login/error");
      }
    });
  });
}

//LL - called on 'user/new' GET
exports.new = function(req, res) {
  res.render("user_new", { title: "Edify | Create a new account" });
};

//LL - called on 'user/new' POST
exports.create = function(req, res) {
  doesUserExist(req, res, createUser);
};

//LL - serves login page
exports.showLogin = function(req, res){
  res.render("login", {title:"Edify | User Login"});
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

exports.show = function(req, res) {
  res.send("user.show");
};

exports.getupdate = function(req, res) {
  var uid = req.session.uid;

  if (uid === undefined)
    return res.redirect("/user/login");

  res.render("user/update",
             { title: "GRRA | Update Account",
              uid: req.params.uid });
};

exports.update = function(req, res) {
  var uid = req.session.uid,
      user=req.body.user,
      pass =req.body.pass;

  if (uid === undefined)
    return res.redirect("/user/login");

  //  var collection = db.collection('users');
  User.findOne({username: user}, function(err, doc) {
    if (err) {
      throw err;
    }
    if (!doc) {
      var document = { username: user, password: pass };
      User.update(
        { _id: uid }, document, {safe: true}, function(err, records) {
          if (err) throw err;
          console.log("Record updated as " + records);
          res.redirect('/user/' + uid + '/feeds');
          //db.close();
        });
    } else {
      console.log("No user found");
      res.redirect('/user/' + uid + '/edit');
    }
  });
};

exports.delete = function(req, res) {
  res.send("user.delete");
};
