$(function() {

// ==========================================================================
//    Setup
// ==========================================================================

// =============Test Begin ==================================================
    //testUrl('http://www.i-am-bored.com/2016/06/40-photos-fancy-cant-think-up-witty-captions-for-108-pics.html');
    //testUrl('http://www.i-am-bored.com/2016/06/a-color-based-breath-test-that-effectively-catches-lung-cancer-pic.html');
    //return;
// =============Test End   ==================================================

    var urlList = [];
    $( "#siteSelection" ).selectmenu();
    $( "#read" ).button();
    $( ".dropbtn" ).click( function() {
        $("#dropdownContent").toggleClass("show");
    });
    window.onclick = function(event) {
        //Remove the dropdown list if clicked anywhere else in the window
        if (!event.target.matches('.dropbtn')) {
            $(".dropdown-content").each(function() {
                if ($('#dropdownContent').hasClass('show')) {
                    $('#dropdownContent').removeClass('show');
                }
            });
        }
    }
    $( "#read" ).click(function() {markAllRead();});
    $("#iab").click(function() {parseRSSFeed(iabrss, parseIABRSS);});
    $("#cracked").click(function() {parseRSSFeed(crackedRSS, parseCrackedRSS);});
    $("#sploid").click(function() {parseRSSFeed(sploidRSS, parseSploidRSS)});
    $(document).ajaxStart(function() {
        $("#articles").empty();
        urlList = [];
    });
    $(document).ajaxStop(function() {
        // When all the pages are done loading, turn the page into an accordion
        //$(this).unbind("ajaxStop"); //prevent running again when other calls finish
        $("#articles").accordion().accordion("destroy").accordion({autoHeight: 'false', heightStyle: 'content', collapsible: true, active: false});
    });
    $.cookie({expires: 30, domain: 'rssmashup.com'});
// ==========================================================================

    var crackedRSS = "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=100&q=http://feeds.feedburner.com/CrackedRSS";
    var iabrss = "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=100&q=http://www.i-am-bored.com/feed";
    var sploidRSS = "http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=100&q=http://sploid.gizmodo.com/rss";

// ==========================================================================
//    Cracked Feed Parsing Section
// ==========================================================================

    function getPageData(url, articleBox, articleXpath) {
        if ($.cookie(url) == "1")
            return;
        else
            urlList.push(url);
        
        requestCrossDomain(url, articleXpath, function(result) {
            if (!result) {
                console.log ("Received empty page. Retrying");
                getPageData(url, articleBox, articleXpath);
            }
            else {
                result = result.replace(/data-img/g, 'src');
                articleBox.append(result);
                articleBox.find('script').remove();
                var head = articleBox.find("header");
                var title = head.find("h1").text();
                var pageUrl = articleBox.find(".PaginationContent").find("ul li:first-child").next().next().find("a").attr("href");
                var pageList = articleBox.find(".PaginationContent").find("ul li:first-child").next().text();
                var curPage = parseInt(pageList.split(" ")[1]);
                var totalPage = parseInt(pageList.split(" ")[3]);
                head.remove();
                articleBox.find("a[target=\"_blank\"]").parent().remove();
                articleBox.find(".socialShareAfterContent").remove();
                articleBox.find("div.facebookWrapperModule").remove();
                articleBox.find("div.noMarginTopWithContent").remove();
                articleBox.find("div.newsletterPopUp").remove();
                articleBox.find("div#footTrack").remove();
                articleBox.find(".ad-footer").remove();
                articleBox.find("nav").remove();
                //console.log("CurrPage = " + curPage + " TotalPage = " + totalPage);
                if (curPage && totalPage && curPage < totalPage) {
                  //console.log(pageUrl);
                  getPageData(pageUrl, articleBox, articleXpath);
                } else {
                    var titleBox = $("<h3>" + title + "</h3>");
                    articleBox.find("footer").remove();
                    $("#articles").append(titleBox);
                    $("#articles").append(articleBox);
                }
            }
        });
    }
    
    function crackedPhotoplasty(url, articleBox, photoplastyXpath) {
        if ($.cookie(url) == "1")
            return;
        else
            urlList.push(url);
        
        requestCrossDomain(url, photoplastyXpath, function(result) {
        if (!result) {
                console.log ("Received empty page. Retrying");
                crackedPhotoplasty(url, articleBox, photoplastyXpath);
            }
            else {
                result = result.replace(/data-img/g, 'src');
                result = result.replace(/data-original/g, 'src');
                articleBox.append($(result));
                var head = articleBox.find("div.content-header");
                var title = head.find("h1").text();
                var titleBox = $("<h3>" + title + "</h3>");
                articleBox.find(".bannerAd").remove();
                articleBox.find('noscript').remove();
                articleBox.find("footer").remove();
                articleBox.find("div#recommendedForYourPleasure").remove();
                articleBox.find("div.content-header").remove();
                articleBox.find("div.sidebar").remove();
                articleBox.find(".social-share-bottom").remove();
                articleBox.find("div.comments-wrap").remove();
                articleBox.find(".persistent-share-inner").remove();
                $("#articles").append(titleBox);
                $("#articles").append(articleBox);
            }
        });
    }
    
    //Parse Cracked RSS feed
    function parseCrackedRSS(response) {
      $(".title").html("Cracked");
      var crackedHome = "http://cracked.com/"
      var len = response.responseData.feed.entries.length;
      var photoplastyXpath = ' and xpath="//ol/li[3]/a"';
      var articleXpath = ' and xpath="//div[@class=\'mainFrame noMarginTopWithContent\']/section[@class=\'mainFrameModule last\']/div/article/section"';
      var personalExperienceXpath = ' and xpath="//div[@class=\'contentWrapper\']"';
      //var articleXpath = ' and xpath="//div[@class=\'mainFrame noMarginTopWithContent\']/section[@class=\'mainFrameModule last\']/div/article/section"';
      var global_article = len+1;
      for (var i=0; i<len; i++) {
        var link = response.responseData.feed.entries[i].link;
        var title = response.responseData.feed.entries[i].title;
        var articleBox = $("<div id=\"article_" + i + "\" class=\"article_box\"></div>");

        //console.log ("Processing link " + link);
        if (link.indexOf("html") != -1) {
            //If the link contains html, it is one among (article, video or personal-experiences)
            if (link.indexOf("video") != -1) {
                //Skip if it is a video. Cracked videos are lame
                console.log("Cracked: Video link. Passing.");
                continue;
            } else if (link.indexOf("article_") != -1) {
                var resr = link.split("/");
                var page_link = crackedHome + resr[resr.length - 1];
                getPageData(page_link, articleBox, articleXpath);
                //Working
            } else if (link.indexOf("personal-experiences")) {
                var resr = link.split("/");
                var page_link = crackedHome + resr[resr.length - 1];
                crackedPhotoplasty(page_link, articleBox, personalExperienceXpath);
            } else {
                console.log("Cracked: Unknown url type " + link);
            }
        } else {
            //If the link does not contain html, it's (photoplasty OR blog)
            if (link.indexOf("video") != -1) {
              console.log("Cracked: Video link. Passing.");
              continue;
            }
            requestCrossDomain(link, photoplastyXpath, function(data) {
                if (!data) {
                    //console.log("Cracked: Unable to get data. trying pp_xpath " + link);
                    var pp_xpath = ' and xpath="//div[@id=\'navbar\']/ul[@id=\'navbarTitle\']/li/a"';
                    requestCrossDomain(link, pp_xpath, function(data_) {
                        if (!data_) {
                            console.log("Cracked: Unable to fetch the url. " + link);
                        } else {
                            articleBox = $("<div id=\"article_" + global_article++ + "\" class=\"article_box\"></div>");
                            var page_link = $(data_).attr("href");
                            var pp = ' and xpath="//div[@data-type=\'photoplasty\']"';
                            crackedPhotoplasty(page_link, articleBox, pp);
                            //Working
                        }
                    });
                } else if (data.indexOf("blog") != -1) {
                    var page_link = $(data).attr("href");
                    articleBox = $("<div id=\"article_" + global_article++ + "\" class=\"article_box\"></div>");
                    getPageData(page_link, articleBox, articleXpath);
                    //Working
                } else if (data.indexOf("photoplasty_") != -1) {
                    var page_link = $(data).attr("href");
                    var pp = ' and xpath="//div[@data-type=\'photoplasty\']"';
                    articleBox = $("<div id=\"article_" + global_article++ + "\" class=\"article_box\"></div>");
                    crackedPhotoplasty(page_link, articleBox, pp);
                    //Working
                } else {
                    console.log("Unknown category " + data);
                }
            });
        }
      }
    }

// End Cracked RSS Parsing
// =================================================================
//
//
// =================================================================
// IAB Parsing Section
// =================================================================
    function getIABPage(url, articleBox) {
        //var articleXpath = ' and xpath="//article[@class=\'post type-post status-publish\']"';
        var articleXpath = ' and xpath="//div[@class=\'col description\']"';
        requestCrossDomain(url, articleXpath, function(data) {
            articleBox.append(data);
            articleBox.find('script').remove();
            var head = articleBox.find("header");
            var title = head.find("h1").text();
            var titleBox = $("<h3>" + title + "</h3>");
            head.remove();
            articleBox.find(".wp-biographia-container-around").remove();
            articleBox.find(".yarpp-related").remove();
            articleBox.find(".slideshow-nav").remove();
            articleBox.find("img.psp-active").each(function(k, image) {
                var act_img = ($(image).attr("data-img"));
                $(image).attr("src", act_img);
            });
            articleBox.find("div.description").find("a").each(function(k, imagesrc) {
                var img_ = $(imagesrc).attr("href");
                if (img_.indexOf(".jpg") || img_.indexOf(".png") ||
                    img_.indexOf("gif")) {
                    imgtag = $(imagesrc).find("img");
                    $(imagesrc).parent().append(imgtag);
                    $(imagesrc).remove();
                }
            });
            $("#articles").append(titleBox);
            $("#articles").append(articleBox);
        });
    }

    function parseIABRSS(response) {
        $(".title").html("I-Am-Bored");
        var len = response.responseData.feed.entries.length;
        for (var i=0; i<len; i++) {
            var lnk = response.responseData.feed.entries[i].link;
            //console.log(lnk);
            var articleBox = $("<div id=\"article_" + i + "\" class=\"article_box\"></div>");
            if ($.cookie(lnk) == "1") {
            } else {
                urlList.push(lnk);
	        getIABPage(lnk, articleBox);
	    }
        }
    }
// =================================================================
// End IAB RSS Parsing
// =================================================================

// =================================================================
// Sploid
// =================================================================
    function processSploidPage(url, articleBox) {
        var articleXpath = ' and xpath="//div[@class=\'post-wrapper\']"';
        console.log("Processing Sploid page " + url);
        requestCrossDomain(url, articleXpath, function(data) {
            articleBox.append(data);
            articleBox.find('script').remove();
            if (articleBox.find("p.has-video").length > 0) {
                // If the article has a video, embed the video in the frame. Else move on.
                var iframe = $('<div id="video_div"><iframe id="video_frame" src="" width="500" height="300"></iframe></div>');
                var video_id = articleBox.find("p.has-video").find("iframe").attr("id");
                if (video_id.indexOf("youtube") >= 0) {
                    var youtubeUrlBuilder = "http://youtube.com/embed/" + video_id.substr(14) + "?rel=0&autoplay=0";
                    iframe.find("#video_frame").attr("src", youtubeUrlBuilder);
                    articleBox.append(iframe);
                } else if (video_id.indexOf("vimeo") >= 0) {
                    var vimeoUrlBuilder = "http://player.vimeo.com/video/" + video_id.substr(6) + "?title=1";
                    iframe.find("#video_frame").attr("src", vimeoUrlBuilder);
                    articleBox.append(iframe);
                }
            }
            var title = articleBox.find("h1").find("a").text();
            var titleBox = $("<h3>" + title + "</h3>");
            articleBox.find("header").remove();
            articleBox.find("h4").remove();
            articleBox.find(".row").remove();
            articleBox.find("script").remove();
            articleBox.find("p.has-video").remove();
            articleBox.find("iframe.recommended").remove();
            articleBox.find(".js_ad-mobile-waypoint").remove();
            articleBox.find("hr").remove();
            $("#articles").append(titleBox);
            $("#articles").append(articleBox);
        });
    }

    function parseSploidRSS(response) {
        $(".title").html("Sploid");
        var len = response.responseData.feed.entries.length;
        var articleXpath = "";
        for (var i=0; i<len; i++) {
            var lnk = response.responseData.feed.entries[i].link;
            var articleBox = $("<div id=\"article_" + i + "\" class=\"article_box\"></div>");
            if ($.cookie(lnk) == "1") {
            } else {
                urlList.push(lnk);
                processSploidPage(lnk, articleBox);
            }
        }
    }
// =================================================================
// End Sploid Parsing
// =================================================================

    //Function to Mark all current articles as read
    function markAllRead() {
        for(var i=0; i<urlList.length; i++) {
            console.log(urlList[i]);
            $.cookie(urlList[i], "1", {expires:30});
        }
    }

    //Function to parse a given rss feed
    function parseRSSFeed(feedUrl, callback) {
      $.ajax({
        url: feedUrl,
        type: "GET",
        dataType: 'jsonp',
        cache: true,
        success: function(response) {callback(response);},
        error: function() {console.log("Failure while parsing the RSS feed. You should see no results");}
      });
    }

    // Accepts a url and a callback function to run.
    function requestCrossDomain( site, xpathParam, callback ) {
        // If no url was passed, exit.
        // console.log("ReqCrossDomain: site=" + site);
        if ( !site ) {
            console.log('No site was passed for requestCrossDomain()');
            return false;
        }
        if ( !xpathParam ) {
            xpathParam = "";
        }
        var yqlBase = 'http://query.yahooapis.com/v1/public/yql?q=';
        var encodeBase = 'select * from html where url="' + site + '"';
        var yqlCallBack = '&format=xml&callback=?';
        var encode = encodeBase + xpathParam;
        var yql = yqlBase + encodeURIComponent(encode) + yqlCallBack;

        // Take the provided url, and add it to a YQL query. Make sure you encode it!
        //http://code.tutsplus.com/tutorials/quick-tip-cross-domain-ajax-request-with-yql-and-jquery--net-10225
        //var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + site + '"') + '&format=xml&callback=?';
        //var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="http://feedproxy.google.com/~r/CrackedRSS/~3/VWvqgS0J3ko/" and xpath="//ol/li[3]/a"') + '&format=xml&callback=?';
        //var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + site + '"') + xpathParam + '&format=xml&callback=?';

        $.getJSON( yql, function(data) {
            //console.log(yql);
            if ( data.results[0] ) {
                //Strip out all script tags, for security reasons.
                //BE VERY CAREFUL. This helps, but we should do more.
                data = data.results[0].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                //If the user passed a callback, and it
                //is a function, call it, and send through the data var.
                //console.log(data);
                if ( typeof callback === 'function') {
                    callback(data);
                }
            }
            //Else, Maybe we requested a site that doesn't exist, and nothing returned.
            //else throw new Error('Nothing returned from getJSON. URL=' + site);
            else {
                //console.log("Nothing returned from YQL. url=" + site);
                callback(null);
                /*$.getJSON('http://whateverorigin.org/get?url=' +
                encodeURIComponent(site) + '&callback=?',
                function (data) {
                    if (!data) {
                        console.log("Error. Nothing returned from whateverorigin. Returning");
                        return;
                    }
                    data = data.contents.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                    if ( typeof callback === 'function') {
                        callback(data);
                    }
                });*/
            }
         });
    }

    function testUrl(url) {
        if (!url) {
            console.log("Error. No url passed");
            return;
        }

        var articleXpath = ' and xpath="//div[@class=\'column\']"';
        requestCrossDomain(url, articleXpath, function(result) {
            console.log("Success");
        });

    }
});
