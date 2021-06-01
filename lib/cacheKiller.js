if (typeof(debug) != 'undefined' && debug) {
  // Check the url parameters.
  var timestamp = (new Date()).getTime();
  if (!window.location.search) {
    // If there aren't any, this is the initial load. Reload the page with a
    // timestamp.
    window.open(window.location.href + '?' + timestamp, '_self');
  } else if ((parseInt(window.location.search.slice(
      1, window.location.search.length)) + 5000) >= timestamp) {
    // If the timestamp in the url is within 5 seconds of the current time,
    // force reload, bypassing the cache.
    window.location.reload(true);
  }
}