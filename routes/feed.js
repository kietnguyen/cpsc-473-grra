#!/usr/bin/env node
"use strict";

require('../models/feed.js');

var _ = require('underscore'),
    mongoose = require('mongoose'),
    Feed = mongoose.model('Feed'),
    User = mongoose.model('User');

// show all feeds from an user
exports.index = function(req, res) {
  var uid = req.params.uid, 
      page = (req.params.page > 0 ? req.params.page : 1) - 1, 
      perPage = 30;

  User.getFeedsByUserId(uid, function (err, user) {
    if (err) 
      return res.render('500', {
        title: 'GRRA | Internal Server Error'
      });

    var options = {
      feeds: user.feeds,
      page: page,
      perPage: perPage
    };

    Feed.list(options, function(err, feeds) {
      if (err) 
        return res.render('500', {
          title: 'GRRA | Internal Server Error'
        });

      //console.dir(feeds);
      res.render('./user/index', {
        title: 'GRRA | Feeds',
        feeds: _.map(feeds, function(val) { return val.items; }),
        page: page + 1,
        pages: Math.ceil(feeds.length / perPage)
      });  
    });

  });
};

exports.new = function(req, res) {
  res.render('feed/new', {
    title: 'GRRA | Create a new feed'
  });
};

exports.create = function(req, res) {
  res.send("feed.create");
};

// show 
exports.show = function(req, res) {
  var uid = parseInt(req.params.uid), 
      fid = parseInt(req.params.fid),
      page = (req.params.page > 0 ? req.params.page : 1) - 1, 
      perPage = 30;

  if (isNaN(uid) || isNaN(fid)) {
    return res.render('404', {
      title: 'GRRA | Page Not Found'
    });
  }

  User.getFeedsByUserId(uid, function (err, user) {
    if (err) {
      return res.render('500', {
        title: 'GRRA | Internal Server Error'
      });
    }

    if (!_.contains(user.feeds, fid)) {
      return res.render('404', {
        title: 'GRRA | Page Not Found'
      });
    }

    var options = {
      feeds: [fid],
      page: page,
      perPage: perPage
    };

    Feed.list(options, function(err, feeds) {
      if (err) 
        return res.render('500', {
          title: 'GRRA | Internal Server Error'
        });

      //console.dir(feeds);
      res.render('./user/index', {
        title: 'GRRA | Feeds',
        feeds: _.map(feeds, function(val) { return val.items; }),
        page: page + 1,
        pages: Math.ceil(feeds.length / perPage)
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