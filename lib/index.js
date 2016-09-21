#!/usr/bin/env node
var packer = {};

packer.gulp = function (program, config, callback) {

  // Error handler
  function handleError(err) {
    console.log(err.toString());
    this.emit('end');
  }

  /* 如果watch列表为空，那就把map里的数据拷贝到watch里 */
  function isWatchCopy(source) {
    if (0 === source.watch.length) {
      return true;
    }
    return false;
  }

  var gulp = require('gulp'),
    concat = require('gulp-concat'),
    watch = require('gulp-watch'),
    cache = require('gulp-cached'),
    extend = require('extend'),
    merge = require('merge-stream'),
    uglify = require('gulp-uglify'),
    handlebars = require('gulp-handlebars'),
    scss = require('gulp-sass'),
    prettyTime = require('pretty-hrtime'),
    path = require('path'),
    fs = require('fs'),
    changed = require('gulp-changed'),
    vendor = require('../lib/vendor'),
    clean = require('gulp-clean'),
    tar = require('gulp-tar'),
    gzip = require('gulp-gzip'),
    gutil = require('gulp-util'),
    wrap = require('gulp-wrapper'),
    sprite = require('gulp.spritesmith'),
    minifyCSS = require('gulp-minify-css'),
    gulpsync = require('gulp-sync')(gulp),
    sourcemaps = require('gulp-sourcemaps'),
    es2015 = require('babel-preset-es2015'),
    babel = require('gulp-babel'),
    order = require('gulp-order');

  var defaultConfig = {
    rootPath: 'public',
    images: {
      imgName: 'icons.png',
      cssName: 'icon.css',
      distCssDir: 'app/styles',
      watch: []
    },
    styles: {
      watch: []
    },
    scripts: {
      watch: []
    },
    templates: {
      watch: []
    },
    views: {
      watch: []
    },
    files: {
      watch: []
    },
    components: {
      watch: []
    }
  }

  // ['**/*', '!./test.js', '!./test.js/**/*']
  /* 把source提取出去 */
  var source = config;
  /* merge一把 */
  source = extend(true, defaultConfig, source);

  /* 是否产生sourceMap */
  var useSourceMaps = (program.build) ? true : false;
  var useMinify = (program.build) ? true : false;

  /* file root path */
  var pathRelative = function(filePath) {
    /* 认为路径里没有 components 的话，就不被打包成 组件的样子 */
    var parse = path.parse(filePath);
    if (-1 != parse.dir.search(/.*components|.*scripts/)){
      var comp = parse.dir.replace(/.*components|.*scripts/, '');
      var array = comp.split(path.sep)
      array.splice(0,1);
      array.push(parse.name);
      return array.join("/");
    }
    return undefined;
  }

  // JS处理
  gulp.task('es6:scripts:app', function() {
    /* 入参检查 */
    if (!source.scripts.map) {
      return 'no scripts map!';
    }

    var merged = merge();
    /* 是否从map表里面拷贝watch */
    var isCopy = isWatchCopy(source.scripts);
    
    for (var dist in source.scripts.map) {
      if (isCopy) {
        source.scripts.watch.push(source.scripts.map[dist])
      }
      var stream = gulp.src(source.scripts.map[dist])
        .pipe( useSourceMaps ? sourcemaps.init() : gutil.noop())
        .pipe( babel({ presets: [es2015], only: ['*.{es6,jsx}'] }).on("error", handleError) )
        .pipe( order(source.scripts.order) )
        .pipe( wrap({
          header: function(file) {
            var path = pathRelative(file.path);
            if(path){
              return 'this.require.define({"' + path + '":function(exports, require, module){';
            }
            return '';
          },
          footer: function(file) {
            if(pathRelative(file.path)){
              return ';}});';
            }
            return '';
          }
        }) )
        .pipe( useMinify ? uglify({preserveComments:'some'}) : gutil.noop() )
        .pipe(concat(dist))
        .pipe(cache('es6:scripts:app'))
        .pipe(wrap({
          header: function(file) {
            var filename = require.resolve('../lib/require_warp');
            return (fs.readFileSync(filename, 'utf8'));
          },
          footer: function(file) {
            return '/* '+ source.scripts.distDir +' done */';
          }
        }))
        .pipe( useSourceMaps ? sourcemaps.write("./sourcemaps") : gutil.noop())
        .pipe(gulp.dest(source.scripts.distDir, { cwd: source.rootPath }));
      merged.add(stream);
    }
    return merged;
  });

  gulp.task('templates:scripts:app', function() {
    
    /* 入参检查 */
    if (!source.templates.map) {
      return 'no templates map!';
    }

    var merged = merge();
    /* 是否从map表里面拷贝watch */
    var isCopy = isWatchCopy(source.templates);
    
    for (var dist in source.templates.map) {
      if (isCopy) {
        source.templates.watch.push(source.templates.map[dist])
      }
      var stream = gulp.src(source.templates.map[dist])
        // .pipe( useSourceMaps ? sourcemaps.init() : gutil.noop())
        .pipe( handlebars({handlebars: require('handlebars')}) )
        // .pipe( order(source.templates.order) )
        .pipe( wrap({
          header: function(file) {
            return 'templates["'+pathRelative(file.path)+'"] = template(';
          },
          footer: function(file) {
            return ');';
          }
        }) )
        // .pipe( useMinify ? uglify({preserveComments:'some'}) : gutil.noop() )
        .pipe(concat(dist))
        .pipe(cache('templates:scripts:app'))
        .pipe(wrap({
          header: function(file) {
            return "(function() { var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};\n";
          },
          footer: function(file) {
            return '})();';
          }
        }))
        // .pipe( useSourceMaps ? sourcemaps.write("./sourcemaps") : gutil.noop())
        .pipe(gulp.dest(source.templates.distDir, { cwd: source.rootPath }));
      merged.add(stream);
    }
    return merged;
  });
  // 样式处理
  gulp.task('css:styles:app', function() {

    /* 入参检查 */
    if (!source.styles.map) {
      return 'no styles map!';
    }

    /* 是否从map表里面拷贝watch */
    var isCopy = isWatchCopy(source.styles);
    var merged = merge();

    for (var dist in source.styles.map) {
      if (isCopy) {
        source.styles.watch.push(source.styles.map[dist])
      }
      var stream = gulp.src(source.styles.map[dist])
        .pipe(useSourceMaps ? sourcemaps.init() : gutil.noop())
        .pipe(scss({ sourceComments: !useSourceMaps, outputStyle: 'expanded' }).on("error", handleError))
        .pipe(useMinify ? minifyCSS() : gutil.noop())
        .pipe(concat(dist))
        .pipe(cache('css:styles:app'))
        .pipe(useSourceMaps ? sourcemaps.write("./sourcemaps") : gutil.noop())
        .pipe(gulp.dest(source.styles.distDir, { cwd: source.rootPath }));
      merged.add(stream);
    }
    return merged;
  });

  // 图片拼接
  gulp.task('images:styles:app', function() {

    /* 入参检查 */
    if (!source.images.src) {
      return 'no images src!';
    }

    /* 生成雪碧图 */
    var spriteData = gulp.src(source.images.src)
      .pipe(sprite({ imgName: source.images.imgName, cssName: source.images.cssName }));

      /* 把雪碧图copy到目标路径 */
    var imgStream = spriteData.img
      .pipe(gulp.dest(source.images.distDir, { cwd: source.rootPath }));

      /* 把雪碧图css到目标路径 */
    var cssStream = spriteData.css
      .pipe(gulp.dest(source.images.distCssDir));

    return merge(imgStream, cssStream);
  });

  // hbs处理
  gulp.task('views:hbs:app', function() {

    /* 入参检查 */
    if (!source.views.src) {
      return 'no views src!';
    }

    return gulp.src(source.views.src)
      .pipe(cache('views:hbs:app'))
      .pipe(gulp.dest(source.views.distDir, { cwd: source.rootPath }));
  });

  gulp.task('components:hbs:app', function() {

    /* 入参检查 */
    if (!source.components.src) {
      return 'no components src!';
    }

    return gulp.src(source.components.src)
      .pipe(cache('components:hbs:app'))
      .pipe(gulp.dest(source.components.distDir, { cwd: source.rootPath }));
  });

  gulp.task('clean:app', function() {
    /* clean files here */
    return gulp.src(source.rootPath)
           .pipe(clean());
  });

  gulp.task('files:app', function() {

    /* 入参检查 */
    if ((!source.files.copy) && (!source.files.tar)) {
      return 'no files!';
    }

    var isCopy = isWatchCopy(source.files);
    var merged = merge();


    for (var dist in source.files.copy) {
      if (isCopy) {
        source.files.watch.push(source.files.copy[dist])
      }
      var stream = gulp.src(source.files.copy[dist])
        .pipe(gulp.dest(dist, { cwd: source.rootPath }));
      merged.add(stream);
    }

    /* 打包 */
    for (var dist in source.files.tar) {
      if (isCopy) {
        source.files.watch.push(source.files.tar[dist])
      }
      var stream = gulp.src(source.files.tar[dist])
        .pipe(tar(dist))
        .pipe(gzip( {append: false} ))
        .pipe(gulp.dest('.', { cwd: source.rootPath }));
      merged.add(stream);
    }
    return merged;
  });

  gulp.task('hbs:app', ['views:hbs:app', 'components:hbs:app']);
  gulp.task('styles:app', gulpsync.sync(['images:styles:app', 'css:styles:app']));
  gulp.task('scripts:app', gulpsync.sync(['templates:scripts:app', 'es6:scripts:app']));

  gulp.task('watch', function () {
    
    if (program.innerwatch) {

        watch(program.configFile,   function () {
          gutil.log(gutil.colors.cyan('配置文件被修改，请'), gutil.colors.red('重启'));
        });

        watch(source.files.watch, function () {
          gulp.start('files:app');
        });
        watch(source.styles.watch, function () {
          gulp.start('css:styles:app');
        });
        watch(source.templates.watch,  function () {
          gulp.start('scripts:app');
        });
        watch(source.scripts.watch,  function () {
          gulp.start('es6:scripts:app');
        });

        var viewWatch = (source.views.watch.length)?(source.views.watch):(source.views.src);
        if (viewWatch) {        
          watch(viewWatch, function () {
            gulp.start('views:hbs:app');
          });
        }

        var imagesWatch = (source.images.watch.length)?(source.images.watch):(source.images.src);
        if (imagesWatch) {
          watch(imagesWatch, function () {
            gulp.start('images:styles:app');
          });
        }
        
        var componentsWatch = (source.components.watch.length)?(source.components.watch):(source.components.src);
        if (componentsWatch) {
          watch(componentsWatch, function () {
            gulp.start('components:hbs:app');
          });
        }

      callback();
    }

  });

  gulp.task('default',

    gulpsync.sync([
      'clean:app',
      'hbs:app',
      'files:app',
      'styles:app',
      'scripts:app',
      'watch'
    ]),
    function() {
      gutil.log(gutil.colors.cyan('************'));
      gutil.log(gutil.colors.cyan('* 编译完成 *'), ((program.innerwatch)?('可以开始编辑代码啦！'):('')));
      gutil.log(gutil.colors.cyan('************'));
    })
    .on('task_stop', function(event) {
      var time = prettyTime(event.hrDuration);
      gutil.log('任务', gutil.colors.cyan(event.task), '完成，耗时', gutil.colors.gray(time));
  });

  /* 外部依赖 */
  if (!program.lazy) {
    var vendorList = source.vendor;
    vendor.get(source.rootPath, source.vendor, function () {
      gulp.start('default');
    })
  }
  else{
    gulp.start('default');
  }

}

module.exports = packer;
