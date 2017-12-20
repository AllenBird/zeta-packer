var vendor = {};
var vendorPath = "vendor";

var request = require('request'),
    chalk = require('chalk'),
    utils = require('./utils'),
    prettyTime = require('pretty-hrtime'),
    fs = require('fs'),
    gunzip = require('gulp-gunzip'),
    untar = require('gulp-untar'),
    gulp = require('gulp'),
    fextra = require('fs-extra'),
    gutil = require('gulp-util'),
    path = require('path');

var requestGet = function (rootPath, list, cb) {

  if (!list || 0 === list.length) {
    cb();
    return;
  }

  var target = list[0];

  var tar = (-1 != target.url.search(/.*\.tar\.gz/))? true : false;
  var name = tar? path.parse(target.url).base : target.name;
  var dest = tar? name : path.join(vendorPath, name);
  fextra.ensureFileSync(dest);

  var basename = path.parse(target.url).base;
  var timeStart = process.hrtime();
  
  console.log('请求', chalk.cyan(target.url));
  if (-1 != target.url.search(/^((https|http|ftp|rtsp|mms)?:\/\/)[^\s]+/)) {
    /* remote load */
    var fileStream = request({url: target.url, rejectUnauthorized: false, timeout: 30000}).on('response', function(response) {
      if (response.statusCode !== 200) {
        console.log('HTTP状态码不正确:', chalk.red(response.statusCode));
        utils.exit(1);
      }
    });
  }
  else{
    /* 本地文件加载 */
    var fileStream = fs.createReadStream(target.url);
  }
  fileStream 
    .on('end', function() {
      list.splice(0,1)

      var timeEnd = process.hrtime(timeStart);
      console.log('下载依赖', chalk.cyan(dest), '完成，耗时', chalk.gray(prettyTime(timeEnd)));
      /* 是否需要解压 - 原先download-pipe有问题，所以把流程拆开了 */
      if (tar) {
        gulp.src(name)
            .pipe(gunzip())
            .pipe(untar())
            .pipe(gulp.dest(target.name,  { cwd: rootPath }))
            .on('end', function () {
              console.log('解压', chalk.cyan(dest), '完成。');
              requestGet(rootPath, list, cb)
            });
      }
      else {
        requestGet(rootPath, list, cb)
      }
    })
    .on('error', function(err) {
        console.log(err);
        utils.exit(1);
      })
    .pipe(fs.createWriteStream(dest));
}

/* 对外提供的外部依赖加载方法 */
vendor.get = function get(rootPath, list, cb) {
  fextra.mkdirs(vendorPath, function () {
    return requestGet(rootPath, list, cb);
  })
}

module.exports = vendor;
