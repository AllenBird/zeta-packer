var vendor = {};
var request = require('request'),
    fs = require('fs'),
    path = require('path');

var requestGet = function (list, cb) {

  if (0 === list.length) {
    cb();
    return;
  }

  var target = list[0];

  var dest = path.join('vendor', target.name)
  request(target.url)
    .on('end', function() {
      list.splice(0,1)
      console.log(dest, 'end!')
      requestGet(list, cb)
    })
    // .pipe(gulp.dest(source.vendor[i].name));
    .pipe(fs.createWriteStream(dest));
}


vendor.get = function get(list, cb) {
  return requestGet(list, cb);
}


module.exports = vendor;
