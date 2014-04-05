#!/usr/bin/env node
"use strict";

require('../models/feed.js');

var _ = require('underscore'),
    mongoose = require('mongoose'),
    Feed = mongoose.model('Feed'),
    User = mongoose.model('User'),
    errorHandler = require('./error');

var feedIndex = function (err, res, feedItems, options) {
  if (err) {
    return errorHandler.loadPage(500, err, res);
  }

  //console.dir(feedItems);
  feedItems = _.map(feedItems, function(val) { return val.items; });
  return res.render('./feed/index', {
    title: 'GRRA | Feeds',
    feedItems: feedItems,
    uid: options.uid,
    page: options.page + 1,
    pages: Math.ceil(options.totalItems / options.perPage)
  });  
};

// show all feeds from a user
exports.index = function(req, res) {
  var uid = parseInt(req.params.uid), 
      page = (req.param('page') > 0 ? req.param('page') : 1) - 1, 
      perPage = 4;

  if (isNaN(uid)) {
    return errorHandler(404, 'uid is NaN', res);
  }

  User.getFeedsByUserId(uid, function (err, user) {
    if (err) {
      return errorHandler.loadPage(500, err, res);
    }

    var options = {
      uid: uid,
      feeds: user.feeds,
      page: page,
      perPage: perPage
    };

    Feed.list(options, function(err, feedItems) {
      if (err) {
        return errorHandler.loadPage(500, err, res);
      }

      Feed.count(options, function(err, total) {
        if (err) {
          console.error(err);
          return errorHandler.loadPage(500, err, res);
        }
        options.totalItems = total[0].total;
        feedIndex(err, res, feedItems, options);
      });
    });

  });
};

exports.new = function(req, res) {
  var uid = parseInt(req.params.uid);

  if (isNaN(uid)) {
    return errorHandler(404, new Error('uid is NaN'), res);
  }

  res.render('feed/new', {
    title: 'GRRA | Create a new feed',
    uid: uid
  });
};

exports.create = function(req, res) {
  res.send("feed.create");
};

// show a feed from a user
exports.show = function(req, res) {
  var uid = parseInt(req.params.uid), 
      fid = parseInt(req.params.fid),
      page = (req.param('page') > 0 ? req.param('page') : 1) - 1, 
      perPage = 4;

  if (isNaN(uid) || isNaN(fid)) {
    return errorHandler.loadPage(404, new Error('uid or fid is NaN'), res);
  }

  User.getFeedsByUserId(uid, function (err, user) {
    if (err) {
      console.error(err);
      return errorHandler.loadPage(500, err, res);
    }

    if (!_.contains(user.feeds, fid)) {
      return errorHandler(404, new Error('user.feeds does not contain fid'), res);
    }

    var options = {
      uid: uid,
      feeds: [fid],
      page: page,
      perPage: perPage
    };

    Feed.list(options, function(err, feedItems) {
      if (err) {
        console.error(err);
        return errorHandler.loadPage(500, err, res);
      }

      Feed.count(options, function(err, total) {
        if (err) {
          console.error(err);
          return errorHandler.loadPage(500, err, res);
        }
        options.totalItems = total[0].total;
        feedIndex(err, res, feedItems, options);
      });
    });

  });
};

exports.edit = function(req, res) {
  res.send("feed.edit");
};

exports.update = function(req, res) {
  res.send("feed.update");
};

exports.delete = function(req, res) {
  res.send("feed.delete");
};