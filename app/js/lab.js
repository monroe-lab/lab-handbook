/* Monroe Lab – Script loader
   Single include for all shared JS modules.
   Order matters: each script may depend on the ones above it.
*/
(function() {
  var scripts = [
    'js/shared.js',
    'js/types.js',
    'js/github-api.js',
    'js/nav.js',
    'js/wikilinks.js',
    'js/rich-input.js',
    'js/editor-modal.js',
    'js/annotate.js',
    'js/issue-reporter.js',
  ];

  // Inherit cache-bust param from our own src (e.g. lab.js?v=abc123)
  var mySrc = document.currentScript ? document.currentScript.getAttribute('src') : '';
  var version = mySrc.indexOf('?') >= 0 ? mySrc.slice(mySrc.indexOf('?')) : '';
  var base = mySrc.replace(/js\/lab\.js.*$/, '');

  scripts.forEach(function(src) {
    document.write('<script src="' + base + src + version + '"><\/script>');
  });
})();
