#!/usr/bin/env node
"use strict";

require("../models/feed.js");

var mongoose = require("mongoose"),
    _ = require("lodash"),
    FeedParser = require("feedparser"),
    request = require("request"),
    async = require("async"),
    Feed = mongoose.model("Feed"),
    errorHandler = require("./error"),
    moment = require("moment");

var request = require("request");
var FeedParser = require("feedparser");

//redirecting using the express method
function redirect(location, res) {
  res.redirect(303, location);
}

var feedIndex = function (err, res, options) {
  if (err) { return errorHandler.loadPage(500, err, res); }

  //console.dir(feedItems);
  return res.render("./feed/index", {
    title: "Edify | Feeds",
    feedItems: options.feedItems,
    uid: options.uid,
    fid: options.fid,
    feedTitles: options.feedTitles,
    page: options.page + 1,
    pages: Math.ceil(options.totalItems / options.perPage)
  });
};

exports.new = function(req, res) {
  var uid = req.session.uid;

  if (uid === undefined){
    return res.redirect("/user/login");
  }

  res.render("feed/new", {
    title: "Edify | Create a new feed",
    uid: uid
  });
};


exports.create = function(req, res) {
  // example1: http://leoville.tv/podcasts/sn.xml
  // example2: http://www.theverge.com/rss/group/tech/index.xml

  var uid = req.session.uid;
  if (uid === undefined){
    return res.redirect("/user/login");
  }

  var flag = true;
  var feedparser = new FeedParser();

  req = request(req.body.url);

  req.on("error", function (err) {
    errorHandler.loadPage(404, err, res);
  });

  req.on("response", function (res) {
    var stream = this;

    if (res.statusCode !== 200){
      return this.emit("error", new Error("Bad status code"));
    }

    stream.pipe(feedparser);
  });

  feedparser.on("error", function() {
    return errorHandler.loadPage(404, new Error("Error parsing"), res);
  });

  feedparser.on("readable", function() {
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

    while (!item) {
      item = stream.read();
      if (item) {
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

    }

    if(flag === true) {
      Feed.find({"title": meta.title}, function(err, theResult) {
        if(theResult.length) {
          Feed.find({"title": meta.title, "uid": uid }, function (err1, theResult1) {
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
          console.dir(meta);
          var feedUrl = (meta.xmlurl || meta.xmlUrl);
          if (!feedUrl) {
            try {
              feedUrl = (meta["atom:id"]["#"] || meta["rdf:@"].about);
            } catch (e) {
              console.error(e);
              //res.redirect("/user/" + uid + "/feeds");
            }
          }
          var newFeed = new Feed({
            uid: [ uid ],
            title: meta.title,
            url:  feedUrl,
            description: meta.description,
          });

          // save the feed entry
          newFeed.save( function(error){
            if(error){
              console.log(error);
              //return errorHandler.loadPage(404, new Error("Feed cannot be saved"), res);
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
    Feed.find({title: meta.title, items: {$elemMatch: {"title": theItem.title} } }, function(err, result) {
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
    if (err){ console.error(err); }
    var redirectUrl = "/user/" + uid + "/feeds";
    redirect(redirectUrl, res);
  });
};

// show a feed or all feeds of a user
exports.index = function(req, res) {
  var fid = req.params.fid,
      uid = req.session.uid,
      page = (req.param("page") > 0 ? req.param("page") : 1) - 1,
      perPage = 4;

  if (uid === undefined){
    return res.redirect("/user/login");
  }

  Feed.getFeedsByUserId(uid, function (err, userFeeds) {
    if (err) {
      return errorHandler.loadPage(500, err, res);
    }

    //console.dir(userFeeds);
    var feedIds = _.pluck(userFeeds, "_id");
    //console.dir(feedIds);
    var options = {
      uid: uid,
      page: page,
      perPage: perPage,
      feedTitles: userFeeds
    };

    if (fid === undefined) {
      // show all feeds
      options.feeds = feedIds;
    }
    else {
      // show specific feed
      feedIds = _.map(feedIds, function(val) { return val.toString(); });
      if (!_.contains(feedIds, fid)) {
        return errorHandler.loadPage(404, new Error("feedIds does not contain " + fid), res);
      }
      options.feeds = [ mongoose.Types.ObjectId(fid) ];
      options.fid = fid;
    }

    Feed.list(options, function(err, feedItems) {
      if (err) {
        console.error(err);
        return errorHandler.loadPage(500, err, res);
      }
      //console.dir(feedItems);
      options.feedItems = _.pluck(feedItems, "items");

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
  var uid = req.session.uid,
      fid = req.params.fid;

  if (uid === undefined){
    return res.redirect("/user/login");
  }

  res.render("feed/edit",{
    uid: uid,
    fid: fid
  });
};

exports.update = function(req, res) {
  var uid = req.session.uid,
      fid = req.params.fid;

  if (uid === undefined){
    return res.redirect("/user/login");
  }

  var title = req.body.title;
  Feed.update({ _id: fid }, {$set: { title: title}}, function(err){
    if (err){ console.error(err);}
    res.redirect("/user/" + uid + "/feeds/" + fid);
  });
};

exports.delete = function(req, res) {
  var uid = req.session.uid,
      fid = req.params.fid;

  if (uid === undefined){
    return res.redirect("/user/login");
  }

  // removes uid from the feed it"s associated with
  Feed.update(
    {"_id": fid, "uid": uid },
    { $pull: { "uid" : uid } },
    function(err, doc) {
      if (err) { console.error(err); }

      console.dir(doc);
      var redirectUrl = "/user/" + uid + "/feeds/";
      redirect(redirectUrl, res);
    }
  );
};

var fetch = function(options, callback) {
  var numOfFeeds = options.urls.length,
      numOfCompletes = 0,
      items = [],
      queryOpts = {};

  async.each(options.urls, function (url) {
    console.log("Fetching ... " + url);
    var fReq = request(url),
        feedparser = new FeedParser();

    fReq.setMaxListeners(50);
    fReq.setHeader("user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36")
    .setHeader("accept", "text/html,application/xhtml+xml");

    fReq.on("error", function(err) {
      if (err) { callback(err); }
    });

    fReq.on("response", function (res) {
      var stream = this;
      if (res.statusCode !== 200) {return this.emit("error", new Error("Bad status code"));}

      stream.pipe(feedparser);
    });

    feedparser.on("error", function(err) {
      if (err) { callback(err); }
    });
    feedparser.on("end", function(err) {
      if (err) { callback(err); }

      numOfCompletes++;

      queryOpts.url = url;
      queryOpts.items = items;
      Feed.addNewItems(queryOpts, function() {
        if (numOfCompletes === numOfFeeds) {
          callback();
        }

      });

    });

    feedparser.on("readable", function() {
      var item;

      while (!item) {
        item = this.read();
        if (item) {
          items.push({
            title: item.title,
            url: (item.origlink || item.link),
            description: item.description,
            pubDate: item.pubdate,
            author: item.author
          });
          break;
        }
      }

    });
  });
};

exports.refresh = function (req, res) {
  var uid = req.session.uid,
      fid = req.params.fid;

  if (uid === undefined){
    return res.redirect("/user/login");
  }

  Feed.getFeedsByUserId(uid, function(err, userFeeds) {
    if (err) {
      return errorHandler.loadPage(500, err, res);
    }

    var feedIds;
    userFeeds = _.pluck(userFeeds, "_id");
    if (fid === undefined) {
      // all feeds
      feedIds = userFeeds;
    }
    else {
      // one feed
      userFeeds = _.map(userFeeds, function(val) { return val.toString(); });
      if (!_.contains(userFeeds, fid)) {
        return errorHandler.loadPage(404, new Error("userFeeds does not contain fid"), res);
      }
      feedIds = [ mongoose.Types.ObjectId(fid) ];
    }

    Feed.getFeedUrls(feedIds, function(err, urls) {
      if (err) {
        return errorHandler.loadPage(500, new Error("Cannot get feeds\" urls"), res);
      }

      var options = {
        urls: _.pluck(urls, "url")
      };
      fetch(options, function(err) {
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

    allFeedIds = _.pluck(allFeedIds, "_id");
    Feed.getFeedUrls(allFeedIds, function(err, urls) {
      if (err) {
        return console.error(err);
      }

      var options = {
        urls:  _.pluck(urls, "url")
      };
      fetch(options, function(err) {
        if (err) { console.error(err); }
      });
    });

  });
};
