#!/usr/bin/env node

// Error handler
function handleError(err) {
  console.log(err.toString());
}

var gulp = require('gulp'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  handlebars = require('gulp-compile-handlebars'),
  scss = require('gulp-sass'),
  chalk = require('chalk'),
  prettyTime = require('pretty-hrtime'),
  path        = require('path'),
  changed = require('gulp-changed'),
  gutil = require('gulp-util'),
  wrap = require('gulp-wrapper'),
  sprite = require('gulp.spritesmith'),
  minifyCSS = require('gulp-minify-css'),
  gulpsync = require('gulp-sync')(gulp),
  sourcemaps = require('gulp-sourcemaps'),
  babel = require('gulp-babel'),
  order = require('gulp-order'),

var defaultConfig = {
  rootPath: 'public',
  images: {
    imgName: 'icons.png',
    cssName: 'icon.css',
    distCssDir: 'app/styles'
  }
}

// ['**/*', '!./atom-shell.app', '!./atom-shell.app/**/*']

var source = {
  rootPath: 'gulpPublic',
  styles: {
    distDir: "assets/styles",
    map: {
      "vendor.css": "vendor/*.css",
      "theme-1.css": "app/{styles,components}/**/*.{css,scss}"
    },
    watch: []
  },
  scripts: {
    distDir: "assets/scripts",
    map: {
      "app.js": "app/{components,scripts}/**/*.{js,jsx,es6}",
      "vendor.js" : "vendor/*.js"
    },
    order: [
      "zetabase.js",
      "templates.js",
      "backgrid.js",
      "backgrid.paginator.js",
      "parsley.js",
      "parsley.i18n.zh_cn.js",
      "fullcalendar.js",
      "fullcalendar.zh-cn.js",
      "prettify.js"
    ],
    watch: []
  },
  views: {
    distDir: "views",
    src: [
      "app/views/**/*.hbs"
    ],
    watch: []
  },
  components: {
    distDir: "components",
    src: [
      "app/components/**/*.hbs"
    ],
    watch: []
  },
  images: {
    distDir: "assets/images",
    src: [
      "app/images/*.png",
      "app/images/other-images/*.png"
    ],
    watch: []
  }
};
/* merge一把 */
source = extend(true, defaultConfig, source);

gutil.log('source: ', source);
gutil.log('watch: ', program.watch);
gutil.log('build: ', program.build);

/* 是否产生sourceMap */
var useSourceMaps = (program.build) ? true : false;
var useMinify = (program.build) ? true : false;

// JS处理
gulp.task('es6:scripts:app', function() {
  var merged = merge();

  var isComponent = function(file) {
    /* 认为路径里没有 components 的话，就不被打包成 组件的样子 */
    var parse = path.parse(file.path);
    if (-1 != parse.dir.search('components')){
      var comp = parse.dir.replace(/.*components/, '');
      var array = comp.split(path.sep)
      array.splice(0,1);
      array.push(parse.name);
      return array.join("/");
    }
    return undefined;
  }

  for (var dist in source.scripts.map) {
    var stream = gulp.src(source.scripts.map[dist])
      .pipe( useSourceMaps ? sourcemaps.init() : gutil.noop())
      .pipe( babel({ presets: ['es2015'], only: ['*.{es6,jsx}'] }).on("error", handleError) )
      .pipe( order(source.scripts.order) )
      .pipe( wrap({
        header: function(file) {
          var path = isComponent(file);
          if(path){
            return 'this.require.define({"' + path + '":function(exports, require, module){';
          }
          return '';
        },
        footer: function(file) {
          if(isComponent(file)){
            return ';}});';
          }
          return '';
        }
      }) )
      .pipe( useMinify ? uglify({preserveComments:'some'}) : gutil.noop() )
      .pipe( useSourceMaps ? sourcemaps.write() : gutil.noop())
      .pipe(concat(dist))
      .pipe(gulp.dest(source.scripts.distDir, { cwd: source.rootPath }));
    merged.add(stream);
  }
  return merged;
});

// 样式处理
gulp.task('css:styles:app', function() {

  var merged = merge();

  for (var dist in source.styles.map) {
    console.log('source.styles', source.styles.map[dist])
    var stream = gulp.src(source.styles.map[dist])
      .pipe(useSourceMaps ? sourcemaps.init() : gutil.noop())
      .pipe(scss({ sourceComments: !useSourceMaps, outputStyle: 'expanded' }).on("error", handleError))
      .pipe(useMinify ? minifyCSS() : gutil.noop())
      .pipe(useSourceMaps ? sourcemaps.write() : gutil.noop())
      .pipe(concat(dist))
      .pipe(gulp.dest(source.styles.distDir, { cwd: source.rootPath }));
    merged.add(stream);
  }
  return merged;
});

// 图片拼接
gulp.task('images:styles:app', function() {
  var spriteData = gulp.src(source.images.src)
    .pipe(sprite({ imgName: source.images.imgName, cssName: source.images.cssName }));

  var imgStream = spriteData.img
    .pipe(gulp.dest(source.images.distDir, { cwd: source.rootPath }));

  var cssStream = spriteData.css
    .pipe(gulp.dest(source.images.distCssDir));

  return merge(imgStream, cssStream);
});

// hbs处理
gulp.task('views:hbs:app', function() {
  return gulp.src(source.views.src)
    .pipe(gulp.dest(source.views.distDir, { cwd: source.rootPath }));
});

gulp.task('components:hbs:app', function() {
  return gulp.src(source.components.src)
    .pipe(gulp.dest(source.components.distDir, { cwd: source.rootPath }));
});

gulp.task('hbs:app', ['views:hbs:app', 'components:hbs:app']);
gulp.task('styles:app', gulpsync.sync(['images:styles:app', 'css:styles:app']));
gulp.task('scripts:app', gulpsync.sync(['es6:scripts:app']));

gulp.task('watch', function () {

  gulp.watch(["app/{components,scripts}/**/*.{js,jsx,es6}", "vendor/*.js"], ['es6:scripts:app']);

  gulp.watch(source.images.src,        ['images:styles:app']);
  gulp.watch(["vendor/*.css", "app/{styles,components}/**/*.{css,scss}"],   ['css:styles:app']);

  gulp.watch(source.components.src,         ['components:hbs:app']);
  gulp.watch(source.views.src,              ['views:hbs:app']);

});

gulp.task('default',

  gulpsync.sync([
    'hbs:app',
    'styles:app',
    'scripts:app',
    'watch'
  ]),
  function() {
    gutil.log(gutil.colors.cyan('************'));
    gutil.log(gutil.colors.cyan('* 编译成功 *'), '可以开始编辑代码啦！');
    gutil.log(gutil.colors.cyan('************'));
  })
  .on('task_stop', function(event) {
    var time = prettyTime(event.hrDuration);
    gutil.log('任务', chalk.cyan(event.task), '完成，耗时', chalk.magenta(time));
  });;

module.exports = packer;


// gulp.start('default');
