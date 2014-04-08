#!/usr/bin/env node
"use strict";

var mongoose = require('mongoose'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    Schema = mongoose.Schema,
    autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection(config.db);
autoIncrement.initialize(connection);

var UserSchema = new Schema({
  _id: { type: Number },
  user: { type: String, trim: true },
  pass:  { type: String, trim: true },
  feeds: [{ type: Number, ref: 'Feed' }]
});

// User validation
UserSchema.path('user').required(true, 'Username cannot be blank');
UserSchema.path('pass').required(true, 'Password cannot be blank');

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
  }
};

UserSchema.plugin(autoIncrement.plugin, 'User');
mongoose.model('User', UserSchema);