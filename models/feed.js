#!/usr/bin/env node
"use strict";

require('./user.js');

var mongoose = require('mongoose'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    Schema = mongoose.Schema,
    autoIncrement = require('mongoose-auto-increment'),
    User = mongoose.model('User');

var connection = mongoose.createConnection(config.db);
autoIncrement.initialize(connection);

var FeedSchema = new Schema({
  _id: { type: Number },
  title: { type: String, trim: true },
  url:  { type: String, trim: true },
  description: { type: String, trim: true },
  items: [{
    title: { type: String, trim: true },
    url: { type: String, trim: true },
    description: { type: String, trim: true },
    pubDate: {type: Date, required: true },
    author: { type: String, trim: true }
  }]
});

// Feed validation
FeedSchema.path('title').required(true, 'Feed title cannot be blank');
FeedSchema.path('url').required(true, 'Feed URL cannot be blank');
FeedSchema.path('description').required(true, 'Feed description cannot be blank');

FeedSchema.methods = {

};

FeedSchema.statics = {
  // List all feeds
  list: function (options, cb) {
    console.dir(options);
    this.aggregate(
      { $match: { _id: { $in: options.feeds } } },
      { $project: { _id: 0, items: 1 } }, 
      { $unwind: '$items'}, 
      { $sort: { 'items.pubDate': -1 } },
      { $limit: options.perPage },
      { $skip: options.perPage * options.page } )
    .exec(cb);
  }, 
  count: function (options, cb) {
    this.aggregate(
      { $match: { _id: { $in: options.feeds } } },
      { $project: { _id: 0, items: 1 } }, 
      { $unwind: '$items'},
      { $group: { _id: null, total: { $sum: 1 } } } )
    .exec(cb);
  }
};

FeedSchema.plugin(autoIncrement.plugin, 'Feed');
mongoose.model('Feed', FeedSchema);