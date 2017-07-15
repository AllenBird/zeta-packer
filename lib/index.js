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
    remember = require('gulp-remember'),
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
    autoprefixer = require('gulp-autoprefixer'),
    es2015 = require('babel-preset-es2015'),
    rev = require('gulp-rev'),
    revReplace = require('gulp-rev-replace'),
    babel = require('gulp-babel'),
    _ = require('underscore'),
    order = require('gulp-order');

  var defaultConfig = {
    rootPath: 'public',
    manifest: "index_layout.hbs",
    sourcemaps: false,
    images: {
      imgName: 'icons.png',
      imgPath: '/assets/images/icons.png',
      cssName: 'icon.css',
      distCssDir: 'app/styles',
      watch: []
    },
    precompile: {
      src: []
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

  /* 把source提取出去 */
  var source = config;
  /* merge一把 */
  source = extend(true, defaultConfig, source);

  /* 是否产生sourceMap */
  var useSourceMaps = source.sourcemaps;
  var useMinify = (program.release) ? true : false;

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
      var isConcat = (dist !== '*') 
      var stream = gulp.src(source.scripts.map[dist])
        .pipe( cache(dist + ':es6:scripts:app') )
        .pipe( useSourceMaps ? sourcemaps.init() : gutil.noop() )
        .pipe( babel({ presets: [es2015], only: ['*.{es6,jsx}'] }).on("error", handleError) )
        .pipe( order(source.scripts.order) )
        .pipe( wrap({
          header: function(file) {
            var path = pathRelative(file.path);
            if(path){
              return _.template('this.require.define({"<%= path %>":function(exports, require, module){')({path: pathRelative(file.path)});
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
        .pipe( useMinify ? uglify({preserveComments: 'some'}).on('error', handleError) : gutil.noop() )
        .pipe(remember(isConcat ? dist : path + ':es6:scripts:app'))
        .pipe(isConcat ? concat(dist) : gutil.noop() )
        .pipe(wrap({
          header: function(file) {
            var filename = require.resolve('../lib/require_warp');
            return (fs.readFileSync(filename, 'utf8'));
          },
          footer: function(file) {
            return _.template('/* <%= message %> done */')({message: source.scripts.distDir});
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
        .pipe(cache('templates:scripts:app'))
        .pipe( handlebars({handlebars: require('handlebars')}) )
        // .pipe( order(source.templates.order) )
        .pipe( wrap({
          header: function(file) {
            var filename = file && file.path && path.parse(file.path).base;
            if ('_' === filename.charAt(0)) {
              return _.template('Handlebars.registerPartial("<%= path %>", Handlebars.template(')({path: pathRelative(file.path)});
            }
            return _.template('templates["<%= path %>"] = template(')({path: pathRelative(file.path)});
          },
          footer: function(file) {
            var filename = file && file.path && path.parse(file.path).base;
            if ('_' === filename.charAt(0)) {
              return '));';
            }
            return ');';
          }
        }) )
        // .pipe( useMinify ? uglify({preserveComments:'some'}) : gutil.noop() )
        .pipe(remember('templates:scripts:app'))
        .pipe(concat(dist))
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

    if (!source.styles.browsers) {
      source.styles.browsers = ['not ie <= 9', '> 1%'];
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
        .pipe(scss({ sourceComments: !useSourceMaps, outputStyle: 'expanded' , includePaths:source.styles.includePaths }).on("error", handleError))
        .pipe(autoprefixer({ browsers: source.styles.browsers}))
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
      .pipe(sprite({ imgName: source.images.imgName, imgPath: source.images.imgPath, cssName: source.images.cssName }));

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
    if ((!source.files.copy) && (!source.files.tar) &&(!source.files.concat)) {
      return 'no files!';
    }

    var isCopy = isWatchCopy(source.files);
    var merged = merge();

    for(var dist in source.files.concat) {
      if (isCopy) {
        source.files.watch.push(source.files.concat[dist]);
      }
      var stream = gulp.src(source.files.concat[dist])
        .pipe(concat(dist))
        .pipe(gulp.dest('.', { cwd: source.rootPath }));
      merged.add(stream);
    }

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

  gulp.task('hash', function () {
    if (program.release) {
      var src = [path.join(source.rootPath, source.scripts.distDir, '**/*.js'), 
               path.join(source.rootPath, source.styles.distDir, '*.css')];
      return gulp.src(src, {base: source.rootPath})
          .pipe(rev()) 
          .pipe(gulp.dest(source.rootPath)) 
          // .pipe(clean({force: true})) 
          .pipe(rev.manifest()) 
          .pipe(gulp.dest(source.rootPath));
    }
  });

  gulp.task('replace', function () {
    if (program.release) {
      var crypto = require('crypto');
      var fileUri = source.rootPath + '/rev-manifest.json';

      if (fs.existsSync(fileUri)) {
        try{
          var fdata = fs.readFileSync(fileUri, 'utf8');
          var manifestObj = JSON.parse(fdata);
          var replaceStr = source.scripts.distDir + '/';
          var sourceMap = {}

          sourceMap['root'] = replaceStr;

          for (var i in manifestObj) {
            var key = i.replace(replaceStr, '')
            // var val = manifestObj[i].replace(replaceStr, '')
            sourceMap[key] = manifestObj[i];
          }
          var fwdata = _.template('window.zetaManifest = <%= data %>;')({data: JSON.stringify(sourceMap)});
          var fileName = '/manifest-' + 
                        crypto.createHash('md5').update(fwdata).digest('hex').slice(0, 10) +
                        '.js';
          var distUri = path.join(source.rootPath, source.scripts.distDir, fileName)
          fs.writeFileSync(distUri, fwdata, {encoding: 'utf8'});

          /* 增加manifest.json中manifest.js的hash表 */
          manifestObj[source.scripts.distDir + '/manifest.js'] = (source.scripts.distDir + fileName);
          fs.writeFileSync(fileUri, JSON.stringify(manifestObj), {encoding: 'utf8'});
        }
        catch (e){
          gutil.log(gutil.colors.red(e));
        }
      }

      var manifest = gulp.src(source.rootPath + '/rev-manifest.json');
        return gulp.src(source.rootPath + '/views/'+ source.manifest)
          .pipe(revReplace({manifest: manifest}))
          .pipe(gulp.dest('views', { cwd: source.rootPath }));
    }
  });

  gulp.task('default',

    gulpsync.sync([
      'clean:app',
      'hbs:app',
      'files:app',
      'styles:app',
      'scripts:app',
      'hash',
      'replace',
      'watch'
    ]),
    function() {
      gutil.log(gutil.colors.cyan('************'));
      gutil.log(gutil.colors.cyan('* 编译完成 *'), ((program.innerwatch)?('可以开始编辑代码啦！'):('')));
      gutil.log(gutil.colors.cyan('************'));
    })
    .on('task_start', function(event){
      if (-1 == event.task.search('group')) {
        gutil.log('开始', gutil.colors.cyan(event.task));
      }
    }) 
    .on('task_stop', function(event) {
      if (-1 == event.task.search('group')) {
        var time = prettyTime(event.hrDuration);
        gutil.log(gutil.colors.gray('完成', event.task, ',耗时', time));
      }
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
