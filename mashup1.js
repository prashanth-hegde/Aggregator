$(function() {



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
