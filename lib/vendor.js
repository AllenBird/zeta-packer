var vendor = {};
var vendorPath = "vendor";

var request = require('request'),
    chalk = require('chalk'),
    prettyTime = require('pretty-hrtime'),
    fs = require('fs'),
    fextra = require('fs-extra'),
    gutil = require('gulp-util'),
    path = require('path');

var requestGet = function (list, cb) {

  if (!list || 0 === list.length) {
    cb();
    return;
  }

  var target = list[0];

  var dest = path.join(vendorPath, target.name)
  var timeStart = process.hrtime();

  request(target.url)
    .on('end', function() {
      list.splice(0,1)

      var timeEnd = process.hrtime(timeStart);
      gutil.log('下载依赖', chalk.cyan(dest), '完成，耗时', chalk.gray(prettyTime(timeEnd)));
      requestGet(list, cb)
    })
    .pipe(fs.createWriteStream(dest));
}


vendor.get = function get(list, cb) {
  fextra.mkdirs(vendorPath, function () {
    return requestGet(list, cb);
  })
}


module.exports = vendor;
