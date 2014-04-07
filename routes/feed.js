#!/usr/bin/env node
"use strict";

require('../models/feed.js');

var _ = require('underscore'),
    mongoose = require('mongoose'),
    Feed = mongoose.model('Feed'),
    User = mongoose.model('User'),
    errorHandler = require('./error');

var request = require('request');
var FeedParser = require('feedparser');

//redirecting using the express method
function redirect(location, res) {
    res.redirect(303, location);
}

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
    fid: options.fid,
    page: options.page + 1,
    pages: Math.ceil(options.totalItems / options.perPage)
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
	//console.log(req.body.url);
	//use example: http://leoville.tv/podcasts/sn.xml
	var req = request(req.body.url)
	  , feedparser = new FeedParser();

	req.on('error', function (error) {
	  return errorHandler.loadPage(404, new Error('Error reading request'), res);
	});

	req.on('response', function (res) {
	  var stream = this;

	  if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

	  stream.pipe(feedparser);
	});


	feedparser.on('error', function(error) {
	  return errorHandler.loadPage(404, new Error('Error parsing'), res);
	});

	feedparser.on('readable', function() {
	  var stream = this
		, meta = this.meta
		, item;

	  while (item = stream.read()) {
		console.log(item.title);
	  }
	  
	});

	redirect("/", res);
/*
  var newFeed = new Feed({
    _id: {  },
	title: {  },
	url:  {  },
	description: {  },
	items: [
	{
	  title: {  },
	  url: {  },
	  description: {  },
	  pubDate: {  },
	  author: {  }
	}]
  });
  
  newFeed.save( function(error, data){
    if(error){
        return errorHandler.loadPage(404, new Error('Feed cannot be saved'), res);
    }
    else{
        redirect("/", res);
    }
  })*/
};

// show a feed or all feeds of a user
exports.index = function(req, res) {
  var uid = parseInt(req.params.uid), 
      fid = parseInt(req.params.fid),
      page = (req.param('page') > 0 ? req.param('page') : 1) - 1, 
      perPage = 4;

  if (isNaN(uid) || (req.params.fid !== undefined && isNaN(fid))) {
    return errorHandler.loadPage(404, new Error('uid or fid is NaN'), res);
  }

  User.getFeedsByUserId(uid, function (err, userFeeds) {
    if (err) {
      return errorHandler.loadPage(500, err, res);
    }

    var options = {
      uid: uid,
      page: page,
      perPage: perPage
    };

    if (req.params.fid === undefined) {
      // show all feeds
      options.feeds = userFeeds.feeds;
    } else {
      if (!_.contains(userFeeds.feeds, fid)) {
        return errorHandler(404, new Error('userFeeds.feeds does not contain fid'), res);
      }
      options.feeds = [fid];
      options.fid = fid;
    }

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
  var uid = parseInt(req.params.uid),
      fid = parseInt(req.params.fid);

      
  res.render('feed/edit',{
      title: req.params.title,
      url : req.params.url,
      uid: uid,
      fid: fid
      });
};

exports.update = function(req, res) {
var uid = parseInt(req.params.uid), 
    fid = parseInt(req.params.fid);
  
  var title = req.body.title;
  Feed.update({ _id: fid }, {$set: { title: title}}, function(err){
  if (err) console.error(err);
    res.redirect('/user/' + uid + '/feeds/' + fid);
  
});
};

exports.delete = function(req, res) {
  var uid = parseInt(req.params.uid), 
      fid = parseInt(req.params.fid);
  
  Feed.remove({ _id: fid }, function(err) {
    if (err) {
       return errorHandler(404, new Error('Invalid feed'), res);
    }
  });
};



exports.refresh = function (req, res) {
  var uid = parseInt(req.params.uid),
      fid = parseInt(req.params.fid);

  if (isNaN(uid) || (req.params.fid !== undefined && isNaN(fid))) {
    return errorHandler.loadPage(404, new Error('uid or fid is NaN'), res);
  }

  User.getFeedsByUserId(uid, function(err, userFeeds) {
    if (err) {
      return errorHandler.loadPage(500, err, res);
    }

    var feeds;
    if (req.params.fid === undefined) {
      // all feeds
      feeds = userFeeds.feeds;
    } else {
      // one feed
      if (!_.contains(userFeeds.feeds, fid)) {
        return errorHandler(404, new Error('userFeeds.feeds does not contain fid'), res);
      }
      feeds = [fid];
    }

    Feed.fetch(feeds);
  });
};

exports.fetch = function (req, res) {
  User.getAllFeeds(function(err, allFeeds) {
    if (err) {
      return errorHandler.loadPage(500, err, res);
    }

    Feed.fetch(allFeeds);
  });
};
