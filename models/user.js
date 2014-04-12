#!/usr/bin/env node
"use strict";

var mongoose = require('mongoose'),
//    autoIncrement = require('mongoose-auto-increment'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    Schema = mongoose.Schema;

//var connection = mongoose.createConnection(config.db);
//autoIncrement.initialize(connection);

var UserSchema = new Schema({
  username: { type: String, trim: true },
  password:  { type: String, trim: true }
});

// User validation
UserSchema.path('username').required(true, 'Username cannot be blank');
UserSchema.path('password').required(true, 'Password cannot be blank');

UserSchema.methods = {

};

UserSchema.statics = {
  // List all feeds of a user
  getFeedsByUserId: function (uid, cb) {
    this.findById(uid, 'feeds')
    .exec(cb);
  },

  // List all feeds of all users
  getAllFeeds: function(cb) {
    this.distinct('feeds')
    .exec(cb);
  },

  validateUserId: function(uid, cb) {
    this.findOne( { _id: uid }, { _id: 1 } )
    .exec(cb);
  }
};

//UserSchema.plugin(autoIncrement.plugin, 'User');
mongoose.model('User', UserSchema);
