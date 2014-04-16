#!/usr/bin/env node
"use strict";

require("./user.js");

var mongoose = require("mongoose"),
    Schema = mongoose.Schema,
    _ = require("lodash");

var FeedSchema = new Schema({
  uid: [{ type: Schema.Types.ObjectId, ref: "User" }],
  title: { type: String, trim: true },
  url:  { type: String, trim: true },
  description: { type: String, trim: true },
  lastUpdate: { type: Date },
  userOptions: [{
    uid: { type: Schema.Types.ObjectId, ref: "User" },
    dateAdded: { type: Date, default: Date.now },
    title: { type: String }
  }],
  items: [{
    title: { type: String, trim: true },
    url: { type: String, trim: true },
    description: { type: String, trim: true },
    pubDate: {type: Date, required: true },
    author: { type: String, trim: true }
  }]
});

// Feed validation
FeedSchema.path("title").required(true, "Feed title cannot be blank");
FeedSchema.path("url").required(true, "Feed URL cannot be blank");

FeedSchema.methods = {

};

FeedSchema.statics = {
  // List all feeds
  list: function(options, cb) {
    //console.dir(options);
    this.aggregate(
      { $match: { _id: { $in: options.feeds } } },
      { $project: { _id: 0, items: 1 } },
      { $unwind: "$items"},
      { $sort: { "items.pubDate": -1 } },
      { $skip: options.perPage * options.page },
      { $limit: options.perPage } )
    .exec(cb);
  },

  // Add new items
  addNewItems: function(queryOpts, cb) {
    //console.dir(queryOpts);
    this.findOne(
      { url: queryOpts.url },
      function(err, feed) {
        var allUrls = _.pluck(feed.items, "url");
        var newItems = _.filter(queryOpts.items, function(val) {
          return !_.contains(allUrls, val.url);
        });

        //console.dir(feed.items.length);
        //console.dir(newItems.length);
        _.each(newItems, function(item) {
          feed.items.push(item);
        });
        //console.dir(feed.items.length);
        feed.save(function(err, product, affected) {
          if (err) {
            console.error(err);
          }

          //console.log(affected);

          cb();
        });
      });
  },

  // Count number of feed items
  getNumOfItems: function(options, cb) {
    this.aggregate(
      { $match: { _id: { $in: options.feeds } } },
      { $project: { _id: 0, items: 1 } },
      { $unwind: "$items"},
      { $group: { _id: null, total: { $sum: 1 } } } )
    .exec(cb);
  },

  // Get feed urls from feed ids
  getFeedUrls: function(feedIds, cb) {
    this.aggregate(
      { $match: { _id: { $in: feedIds } } },
      { $project: { _id: 0, url: 1 } })
    .exec(cb);
  },

  loadFromUrl: function(url, cb) {
    this.findOne({url: url})
    .exec(cb);
  },

  getFeedsByUserId: function(uid, cb) {
    this.find(
      { uid: uid },
      { title: 1 })
    .exec(cb);
  },

  getAllFeeds: function(cb) {
    this.find(
      { uid: { $not: { $size: 0 } } },
      { _id: 1 } )
    .exec(cb);
  },

  validateFeedId: function(fid, cb) {
    this.findOne( { _id: fid }, { _id: 1 } )
    .exec(cb);
  }

};

mongoose.model("Feed", FeedSchema);
