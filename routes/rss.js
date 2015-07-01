var express = require('express');
var router = express.Router();

var request = require('request');
var cheerio = require('cheerio');

var rss = require('rssparser');
var feed = require('node-rss');
var feedOptions = require('./rss.json');

var url = "http://sploid.gizmodo.com/slow-motion-video-of-a-142mph-tennis-serve-shows-the-ba-1715028606"

function extractURL(url, extract, filter) {
    request(url, function(err, resp, body){
        if (!err && resp.statusCode==200) {
            var $ = cheerio.load(body);
            var description = $(extract);
            for(var i=0; i<filter.length; i++) {
                console.log(filter[i]);
                description = description.filter(filter[i]);
            }
            console.log(description);
        } else {
            console.log("Error while extracting url " + url);
        }
    });
}

function extractFeed(feed) {
    var opt = {};
    rss.parseURL(feed.feedURL, {}, function(err, out) {
        for (var i=0; i<out.items.length; i++) {
            console.log("================");
            console.log(out.items[i].title);
            console.log(out.items[i].url);
            extractURL(out.items[i].url, feed.extract, feed.filters);
            console.log("================");
        }
    });
}

//Extract links from each field and populate the description with the contents of the link
for (var i=0; i<feedOptions.feeds.length; i++) {
    extractFeed(feedOptions.feeds[i]);
}

//extractURL(url, "div.post-content", ["p[data-textannotation-id]", "div.ad-unit"]);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'ExpressRSS' });
});

module.exports = router;
