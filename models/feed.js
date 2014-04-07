#!/usr/bin/env node
"use strict";

require('./user.js');

var mongoose = require('mongoose'),
    async = require('async'),
    autoIncrement = require('mongoose-auto-increment'),
    feedparser = require('feedparser'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config/config')[env],
    Schema = mongoose.Schema,
    User = mongoose.model('User');

var connection = mongoose.createConnection(config.db);
autoIncrement.initialize(connection);

var FeedSchema = new Schema({
  _id: { type: Number },
  uid: [{ type: Number }],
  title: { type: String, trim: true },
  url:  { type: String, trim: true },
  description: { type: String, trim: true },
  lastUpdate: { type: Date },
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
  list: function(options, cb) {
    //console.dir(options);
    this.aggregate(
      { $match: { _id: { $in: options.feeds } } },
      { $project: { _id: 0, items: 1 } }, 
      { $unwind: '$items'}, 
      { $sort: { 'items.pubDate': -1 } },
      { $skip: options.perPage * options.page },
      { $limit: options.perPage } )
    .exec(cb);
  }, 

  count: function(options, cb) {
    this.aggregate(
      { $match: { _id: { $in: options.feeds } } },
      { $project: { _id: 0, items: 1 } }, 
      { $unwind: '$items'},
      { $group: { _id: null, total: { $sum: 1 } } } )
    .exec(cb);
  },

  fetch: function(feeds, cb) {
    // increase limit if server can handle more
    async.eachLimit(feeds, 8, function (feed, cb) {

    });
  }
};

FeedSchema.plugin(autoIncrement.plugin, 'Feed');
mongoose.model('Feed', FeedSchema);
