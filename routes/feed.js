#!/usr/bin/env node
"use strict";

require('../models/feed.js');

var _ = require('underscore'),
    mongoose = require('mongoose'),
    FeedParser = require('feedparser'),
    request = require('request'),
    async = require('async'),
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
    feedTitle: "",
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
	//use example: http://leoville.tv/podcasts/sn.xml
	
	var uid = req.params.uid;
	
	var flag = true;
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
	  
	  var theArray = [];
	  var theItem;
	  while (item = stream.read()) {

		theItem = {
			title: item.title,
			url: item.link,
			description: item.description,
			pubDate: item.pubdate,
			author: item.author
		};
		theArray.push(theItem);

	  }
	  
	  if(flag === true) {
	  Feed.find({'title': meta.title}, function(err, theResult) {
		if(theResult.length) {
			Feed.find({'title': meta.title, 'uid': {$in: [uid]} }, function (err1, theResult1) {
				if(theResult1.length) {
					// uid is already stored
				}
				else {
					Feed.update({title: meta.title}, {$push: {"uid": uid}}, function(err) { if (err) {console.log("error");}});
				}
			});
		}
		else {
		  var newFeed = new Feed({
			uid: uid,
			title: meta.title,
			url:  meta.link,
			description: meta.description,
		  });
		  
		  newFeed.save( function(error, data){
			if(error){
				return errorHandler.loadPage(404, new Error('Feed cannot be saved'), res);
			}
			else{
			}
		  })
	    }
	  });
	    
	  flag = false;
	  
	  }
	  
	  Feed.update({title: meta.title}, {$push: {"items": theItem}}, function(err) { 
		if (err) {
			console.log("error");
		}
	  });
  
	});
	
	var redirectUrl = "/user/" + uid + "/feeds/";
	redirect("/", res);
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
      // show specific feed
      if (!_.contains(userFeeds.feeds, fid)) {
        return errorHandler.loadPage(404, new Error('userFeeds.feeds does not contain fid'), res);
      }
      options.feeds = [fid];
      options.fid = fid;
    }

    Feed.list(options, function(err, feedItems) {
      if (err) {
        console.error(err);
        return errorHandler.loadPage(500, err, res);
      }

      Feed.getNumOfItems(options, function(err, total) {
        if (err) {
          console.error(err);
          return errorHandler.loadPage(500, err, res);
        }

        options.totalItems = (total.length === 0 ? 0 : total[0].total);
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

	Feed.update(
		{'_id': fid }, 
		{ $pull: { "uid" : uid } },
		false,
		true 
	);
/*
  Feed.remove({ _id: fid }, function(err) {
    if (err) {
       return errorHandler.loadPage(404, new Error('Invalid feed'), res);
    }
  });
  */
};

var fetch = function(options, callback) {
  async.each(options.urls, function (url) {
    console.log("Fetching ... " + url);
    var fReq = request(url),
        feedparser = new FeedParser();

    fReq.setMaxListeners(50);
    fReq.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
    .setHeader('accept', 'text/html,application/xhtml+xml');

    fReq.on('error', function(err) {
      if (err) console.error(err);
    });

    fReq.on('response', function (res) {
      var stream = this;
      if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

      stream.pipe(feedparser);
    });

    feedparser.on('error', function(err) {
      if (err) console.error(err);
    });
    feedparser.on('end', function(err) {
      if (err) console.error(err);
    });
    feedparser.on('readable', function() {
      var stream = this, 
          meta = this.meta, 
          item;

      while (item = stream.read()) {
        var newItem = {
          title: item.title,
          url: item.link,
          description: item.description,
          pubDate: item.pubdate, 
          author: item.author
        };

        Feed.count({'items.url': item.link}, function(err, result) {
          if (err) return console.error(err);

          if (result === 0) {
            console.log(" - Adding ... " + newItem.url);
            Feed.update(
              { url: url },
              { $push: { items: newItem } },
              { upsert: true },
              function(err) {
                if (err) console.error(err);
              });
          }
          
        })
      }

    });
  }, callback);
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

    var feedIds;
    if (req.params.fid === undefined) {
      // all feeds
      feedIds = userFeeds.feeds;
    } else {
      // one feed
      if (!_.contains(userFeeds.feeds, fid)) {
        return errorHandler(404, new Error('userFeeds.feeds does not contain fid'), res);
      }
      feedIds = [fid];
    }

    Feed.getFeedUrls(feedIds, function(err, urls) {
      if (err) {
        return errorHandler.loadPage(500, new Error('Error: cannot get feeds\' urls'), res);
      }

      var options = {
        urls: _.map(urls, function(val) { return val.url; })
      };
      fetch(options, function(err, fetchResult) {
        if (err) console.error(err);
        res.redirect(req.url.substring(0, req.url.length - 8));
      });  
    });
  });
};

exports.refreshAll = function (req, res) {
  User.getAllFeeds(function(err, allFeedIds) {
    if (err) {
      return errorHandler.loadPage(500, err, res);
    }

    Feed.getFeedUrls(allFeedIds, function(err, urls) {
      if (err) {
        return console.error(err);
      }

      var options = {
        urls:  _.map(urls, function(val) { return val.url; })
      };
      fetch(options, function(err) {
        if (err) console.err(err);
      });  
    });

  });
};
