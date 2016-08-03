var vendor = {};
var vendorPath = "vendor";

var request = require('request'),
    chalk = require('chalk'),
    prettyTime = require('pretty-hrtime'),
    fs = require('fs'),
    fextra = require('fs-extra'),
    gutil = require('gulp-util'),
    path = require('path');

var sourceStream = require('vinyl-source-stream');
var gunzip = require('gulp-gunzip');
var untar = require('gulp-untar');
var gulp = require('gulp');

var requestGet = function (rootPath, list, cb) {

  if (!list || 0 === list.length) {
    cb();
    return;
  }

  var target = list[0];

  var dest = path.join(vendorPath, target.name)
  var tar = (-1 != target.url.search(/.*\.tar\.gz/))? true : false;
  var basename = path.parse(target.url).base;

  var timeStart = process.hrtime();
  request(target.url)
    .on('end', function() {
      list.splice(0,1)

      var timeEnd = process.hrtime(timeStart);
      console.log('下载依赖', chalk.cyan(dest), '完成，耗时', chalk.gray(prettyTime(timeEnd)));
      requestGet(rootPath, list, cb)
    })
    .pipe(tar? sourceStream(basename) : gutil.noop())
    .pipe(tar? gunzip() : gutil.noop())
    .pipe(tar? untar() : gutil.noop())
    .pipe(tar? gulp.dest(target.name,  { cwd: rootPath }) : gutil.noop())
    .pipe(tar? gutil.noop() : fs.createWriteStream(dest))
}


vendor.get = function get(rootPath, list, cb) {
  fextra.mkdirs(vendorPath, function () {
    return requestGet(rootPath, list, cb);
  })
}


module.exports = vendor;
