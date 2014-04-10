#!/usr/bin/env node
"use strict";

require('../models/feed.js');

var mongoose = require('mongoose'),
    _ = require('lodash'),
    FeedParser = require('feedparser'),
    request = require('request'),
    async = require('async'),
    Feed = mongoose.model('Feed'),
    errorHandler = require('./error');

var request = require('request');
var FeedParser = require('feedparser');

//redirecting using the express method
function redirect(location, res) {
  res.redirect(303, location);
}

var feedIndex = function (err, res, options) {
  if (err) { return errorHandler.loadPage(500, err, res); }

  //console.dir(feedItems);
  return res.render('./feed/index', {
    title: 'Edify | Feeds',
    feedItems: feedItems,
    uid: options.uid,
    fid: options.fid,
    feedTitles: options.feedTitles,
    page: options.page + 1,
    pages: Math.ceil(options.totalItems / options.perPage)
  });
};

exports.new = function(req, res) {
  var uid = req.session.uid;

  if (uid === undefined)
    return res.redirect("/user/login");

  res.render('feed/new', {
    title: 'Edify | Create a new feed',
    uid: uid
  });
};


exports.create = function(req, res) {
  // example1: http://leoville.tv/podcasts/sn.xml
  // example2: http://www.theverge.com/rss/group/tech/index.xml

  var uid = req.session.uid;
  if (uid === undefined)
    return res.redirect("/user/login");

  var flag = true;

  req = request(req.body.url);
  var feedparser = new FeedParser();

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
    var stream = this,
        meta = this.meta,
        item;

    var theArray = [];
    var theItem = {
      title: "",
      url: "",
      description: "",
      pubDate: "",
      author: ""
    };
    var updateFlag = true;

    while (item = stream.read()) {
      theItem = {
        title: item.title,
        url: item.link,
        description: item.description,
        pubDate: item.pubdate,
        author: item.author
      };
      // push the items to prepare for storage in database
      theArray.push(theItem);

    }

    if(flag === true) {
      Feed.find({'title': meta.title}, function(err, theResult) {
        if(theResult.length) {
          Feed.find({'title': meta.title, 'uid': uid }, function (err1, theResult1) {
            if(theResult1.length) {
              // uid is already stored
            }
            else {
              // if the uid does not exist, store it in the uid array
              Feed.update({title: meta.title}, {$push: {"uid": uid}}, function(err) { if (err) {console.log("error");}});
            }
          });
          console.log("flag is false");
          updateFlag = false;
        }
        else {
          // create new feed entry
          var feedUrl = meta.xmlurl;
          if (!feedUrl) { feedUrl = meta["atom:id"]["#"]; }
          var newFeed = new Feed({
            uid: [ uid ],
            title: meta.title,
            url:  feedUrl,
            description: meta.description,
          });

          // save the feed entry
          newFeed.save( function(error, data){
            if(error){
              console.log(error);
              return errorHandler.loadPage(404, new Error('Feed cannot be saved'), res);
            }
            else{
            }
          });
        }
      });

      flag = false;

    }

    // push the items into the items array in the database entry
    // find to see if item is already in the field
    Feed.find({title: meta.title, items: {$elemMatch: {'title': theItem.title} } }, function(err, result) {
      if (result.length) {
      }
      else {
        // if item is not there, add it to the entry
        Feed.update({title: meta.title}, {$push: {"items": theItem}}, function(err) {
          if (err) {
            console.log("error");
          }
        });
      }
    });
  });

  feedparser.on("end", function(err) {
    if (err) console.error(err);

    var redirectUrl = "/user/" + uid + "/feeds/";
    redirect(redirectUrl, res);
  });
};

// show a feed or all feeds of a user
exports.index = function(req, res) {
  var fid = req.params.fid,
      uid = req.session.uid,
      page = (req.param('page') > 0 ? req.param('page') : 1) - 1,
      perPage = 4;

  if (uid === undefined)
    return res.redirect("/user/login");

  Feed.getFeedsByUserId(uid, function (err, userFeeds) {
    if (err) {
      return errorHandler.loadPage(500, err, res);
    }

    //console.dir(userFeeds);
    var feedIds = _.map(userFeeds, function(val) { return val._id; });
    console.dir(feedIds);
    var options = {
      uid: uid,
      page: page,
      perPage: perPage,
      feedTitles: userFeeds
    };

    if (fid === undefined) {
      // show all feeds
      options.feeds = feedIds;
    } else {
      // show specific feed
      feedIds = _.map(feedIds, function(val) { return val.toString(); });
      if (!_.contains(feedIds, fid)) {
        return errorHandler.loadPage(404, new Error('feedIds does not contain ' + fid), res);
      }
      options.feeds = [ mongoose.Types.ObjectId(fid) ];
      options.fid = fid;
    }

    Feed.list(options, function(err, feedItems) {
      if (err) {
        console.error(err);
        return errorHandler.loadPage(500, err, res);
      }

      options.feedItems = _.map(feedItems, function(val) { return val.items; });

      // Get total number of feed items
      Feed.getNumOfItems(options, function(err, total) {
        if (err) {
          console.error(err);
          return errorHandler.loadPage(500, err, res);
        }

        options.totalItems = (total.length === 0 ? 0 : total[0].total);
        feedIndex(err, res, options);
      });
    });

  });
};

exports.edit = function(req, res) {
  var uid = req.params.uid,
      fid = req.params.fid;


  res.render('feed/edit',{
    title: req.params.title,
    url : req.params.url,
    uid: uid,
    fid: fid
  });
};

exports.update = function(req, res) {
  var uid = req.params.uid,
      fid = req.params.fid;

  var title = req.body.title;
  Feed.update({ _id: fid }, {$set: { title: title}}, function(err){
    if (err) console.error(err);
    res.redirect('/user/' + uid + '/feeds/' + fid);
  });
};

exports.delete = function(req, res) {
  var uid = req.params.uid,
      fid = req.params.fid;

  // removes uid from the feed it's associated with
  Feed.update(
    {'_id': fid, 'uid': uid },
    { $pull: { "uid" : uid } },
    function(err) {}
  );

  var redirectUrl = "/user/" + uid + "/feeds/";
  redirect(redirectUrl, res);


};

var fetch = function(options, callback) {
  var numOfFeeds = options.urls.length,
      numOfCompletes = 0;
  async.each(options.urls, function (url) {
    console.log("Fetching ... " + url);
    var fReq = request(url),
        feedparser = new FeedParser();

    fReq.setMaxListeners(50);
    fReq.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
    .setHeader('accept', 'text/html,application/xhtml+xml');

    fReq.on('error', function(err) {
      if (err) { callback(err); }
    });

    fReq.on('response', function (res) {
      var stream = this;
      if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

      stream.pipe(feedparser);
    });

    feedparser.on('error', function(err) {
      if (err) { callback(err); }
    });
    feedparser.on('end', function(err) {
      if (err) { callback(err); }

      numOfCompletes++;
      if (numOfCompletes === numOfFeeds)
        callback();
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
        });
      }
    });
  }, callback);
};

exports.refresh = function (req, res) {
  var uid = req.session.uid,
      fid = req.params.fid;

  if (uid === undefined)
    return res.redirect("/user/login");

  Feed.getFeedsByUserId(uid, function(err, userFeeds) {
    if (err) {
      return errorHandler.loadPage(500, err, res);
    }

    var feedIds;
    userFeeds = _.map(userFeeds, function(val) { return val._id; });
    if (fid === undefined) {
      // all feeds
      feedIds = userFeeds;
    } else {
      // one feed
      userFeeds = _.map(userFeeds, function(val) { return val.toString(); });
      if (!_.contains(userFeeds, fid)) {
        return errorHandler.loadPage(404, new Error('userFeeds does not contain fid'), res);
      }
      feedIds = [ mongoose.Types.ObjectId(fid) ];
    }

    Feed.getFeedUrls(feedIds, function(err, urls) {
      if (err) {
        return errorHandler.loadPage(500, new Error('Cannot get feeds\' urls'), res);
      }

      var options = {
        urls: _.map(urls, function(val) { return val.url; })
      };
      fetch(options, function(err, fetchResult) {
        if (err) {
          return errorHandler.loadPage(500, err, res);
        }
        res.redirect(req.url.substring(0, req.url.length - 8));
      });
    });
  });
};

exports.refreshAll = function (req, res) {
  Feed.getAllFeeds(function(err, allFeedIds) {
    if (err) {
      return errorHandler.loadPage(500, err, res);
    }

    allFeedIds = _.map(allFeedIds, function(val) { return val._id; });
    Feed.getFeedUrls(allFeedIds, function(err, urls) {
      if (err) {
        return console.error(err);
      }

      var options = {
        urls:  _.map(urls, function(val) { return val.url; })
      };
      fetch(options, function(err) {
        if (err) { console.error(err); }
      });
    });

  });
};
