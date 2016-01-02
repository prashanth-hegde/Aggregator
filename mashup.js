$(function() {

// ==========================================================================
//    Setup
// ==========================================================================
    //var urlList = [];
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

    function getPageData(url, articleBox) {
        var articleXpath = ' and xpath="//div[@class=\'mainFrame noMarginTopWithContent\']/section[@class=\'mainFrameModule last\']/div/article/section"';
        requestCrossDomain(url, articleXpath, function(result) {
            result = result.replace(/data-img/g, 'src');
            articleBox.append(result);
            articleBox.find('script').remove();
            var head = articleBox.find("header");
            var title = head.find("h1").text();
            head.remove();
            articleBox.find("a[target=\"_blank\"]").parent().remove();
            $(".socialShareAfterContent").remove();
            $(".FacebookLike").remove();
            var pageUrl = articleBox.find(".PaginationContent").find("ul li:first-child").next().next().find("a").attr("href");
            var pageList = articleBox.find(".PaginationContent").find("ul li:first-child").next().text();
            var curPage = parseInt(pageList.split(" ")[1]);
            var totalPage = parseInt(pageList.split(" ")[3]);
            articleBox.find("nav").remove();
            //console.log("CurrPage = " + curPage + " TotalPage = " + totalPage);
            if (curPage && totalPage && curPage < totalPage) {
              //console.log(pageUrl);
              getPageData(pageUrl, articleBox);
            } else {
                var titleBox = $("<h3>" + title + "</h3>");
                articleBox.find("footer").remove();
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
      //var articleXpath = ' and xpath="//div[@class=\'mainFrame noMarginTopWithContent\']/section[@class=\'mainFrameModule last\']/div/article/section"';
      for (var i=0; i<len; i++) {
        var link = response.responseData.feed.entries[i].link;
        var title = response.responseData.feed.entries[i].title;
        var resr = link.split("/");
        var temp = resr[resr.length - 1];
        if (temp == "") {
            //No html page at the end means this is a Photoplasty site
            requestCrossDomain(link, photoplastyXpath, function(data) {
                var lnk = $(data).attr("href");
                var articleBox = $("<div id=\"article_" + i + "\" class=\"article_box\"></div>");
                getPageData(lnk, articleBox);
            });
        } else if (temp.substr(0, 5) == "video") {
            //If it is a video link, pass it. Cracked videos are lame
            console.log("Video link. Passing")
            continue;
        } else {
            var pageUrl = crackedHome + temp;
            var articleBox = $("<div id=\"article_" + i + "\" class=\"article_box\"></div>");
            getPageData(pageUrl, articleBox);
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
            $("#articles").append(titleBox);
            $("#articles").append(articleBox);
        });
    }

    function parseIABRSS(response) {
        $(".title").html("I-Am-Bored");
        var len = response.responseData.feed.entries.length;
        for (var i=0; i<len; i++) {
            var lnk = response.responseData.feed.entries[i].link;
            var articleBox = $("<div id=\"article_" + i + "\" class=\"article_box\"></div>");
            getIABPage(lnk, articleBox);
        }
    }
// =================================================================
// End IAB RSS Parsing
// =================================================================

// =================================================================
// Sploid
// =================================================================
    function processSploidPage(url, articleBox) {
        var articleXpath = ' and xpath="//div[@class=\'column\']"';
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
        var urlList = ["Temp1", "Temp2"];
        $.cookie({expires: 30, domain: 'rssmashup.com', path: '/127.0.0.1'});
        for(var i=0; i<urlList.length; i++) {
            console.log(urlList[i]);
            $.cookie(urlList[i], "1", {expires:30});
            console.log("Reading back: " + $.cookie(urlList[i]));
        }
        //console.log($.cookie());
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

    /*
    // BONUS: Another method of obtaining Cross Domain web pages
    $.getJSON('http://whateverorigin.org/get?url=' +
    encodeURIComponent('http://feedproxy.google.com/~r/CrackedRSS/~3/VWvqgS0J3ko/') + '&callback=?',
    function (data) {
        console.log("Success");

        //If the expected response is text/plain
        //$("#viewer").html(data.contents);

        //If the expected response is JSON
        //var response = $.parseJSON(data.contents);
    });*/

    // Request that YSQL string, and run a callback function.
    // Pass a defined function to prevent cache-busting.
    $.getJSON( yql, function(data) {
        if ( data.results[0] ) {
            // Strip out all script tags, for security reasons.
            // BE VERY CAREFUL. This helps, but we should do more.
            data = data.results[0].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

            // If the user passed a callback, and it
            // is a function, call it, and send through the data var.
            if ( typeof callback === 'function') {
                callback(data);
            }
        }
            // Else, Maybe we requested a site that doesn't exist, and nothing returned.
            //else throw new Error('Nothing returned from getJSON. URL=' + site);
            else console.log('Nothing returned from getJSON. URL=' + site);
     });
    }
});
