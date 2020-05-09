"use strict";

var gulp = require("gulp"),
  sass = require("gulp-sass"),
  del = require("del"),
  uglify = require("gulp-uglify"),
  cleanCSS = require("gulp-clean-css"),
  rename = require("gulp-rename"),
  merge = require("merge-stream"),
  htmlreplace = require("gulp-html-replace"),
  autoprefixer = require("gulp-autoprefixer"),
  browserSync = require("browser-sync").create(),
  imagemin = require('gulp-imagemin');

// Clean task
gulp.task("clean", function() {
  return del(["./*.html", "./build/assets/css/app.css"]);
});

// Copy third party libraries from node_modules into /vendor
gulp.task("vendor:js", function() {
  return gulp
    .src([
      "./node_modules/bootstrap/dist/js/*",
      "./node_modules/jquery/dist/*",
      "!./node_modules/jquery/dist/core.js",
      "./node_modules/popper.js/dist/umd/popper.*"
    ])
    .pipe(gulp.dest("./build/assets/js/vendor"));
});

// Copy font-awesome from node_modules into /fonts
gulp.task("vendor:fonts", function() {
  return gulp
    .src([
      "./node_modules/@fortawesome/fontawesome-free/**/*",
      "!./node_modules/@fortawesome/fontawesome-free/{less,less/*}",
      "!./node_modules/@fortawesome/fontawesome-free/{scss,scss/*}",
      "!./node_modules/@fortawesome/fontawesome-free/.*",
      "!./node_modules/@fortawesome/fontawesome-free/*.{txt,json,md}"
    ])
    .pipe(gulp.dest("./build/assets/fonts/font-awesome"));
});

// vendor task
gulp.task("vendor", gulp.parallel("vendor:fonts", "vendor:js"));

// Copy vendor's js to /dist
gulp.task("vendor:build", function() {
  var jsStream = gulp
    .src([
      "./build/assets/js/vendor/bootstrap.bundle.min.js",
      "./build/assets/js/vendor/jquery.slim.min.js",
      "./build/assets/js/vendor/popper.min.js"
    ])
    .pipe(gulp.dest("./assets/js/vendor"));
  var fontStream = gulp
    .src(["./build/assets/fonts/font-awesome/**/*.*"])
    .pipe(gulp.dest("./assets/fonts/font-awesome"));
  return merge(jsStream, fontStream);
});

// Copy Bootstrap SCSS(SASS) from node_modules to /assets/scss/bootstrap
gulp.task("bootstrap:scss", function() {
  return gulp
    .src(["./node_modules/bootstrap/scss/**/*"])
    .pipe(gulp.dest("./build/assets/scss/bootstrap"));
});

// Compile SCSS(SASS) files
gulp.task(
  "scss",
  gulp.series("bootstrap:scss", function compileScss() {
    return gulp
      .src(["./build/assets/scss/*.scss"])
      .pipe(
        sass
          .sync({
            outputStyle: "expanded"
          })
          .on("error", sass.logError)
      )
      .pipe(autoprefixer())
      .pipe(gulp.dest("./build/assets/css"));
  })
);

// Minify CSS
gulp.task(
  "css:minify",
  gulp.series("scss", function cssMinify() {
    return gulp
      .src("./build/assets/css/app.css")
      .pipe(cleanCSS())
      .pipe(
        rename({
          suffix: ".min"
        })
      )
      .pipe(gulp.dest("./assets/css"))
      .pipe(browserSync.stream());
  })
);

// Minify Js
gulp.task("js:minify", function() {
  return gulp
    .src(["./build/assets/js/app.js"])
    .pipe(uglify())
    .pipe(
      rename({
        suffix: ".min"
      })
    )
    .pipe(gulp.dest("./assets/js"))
    .pipe(browserSync.stream());
});

// Replace HTML block for Js and Css file upon build and copy to /dist
gulp.task("replaceHtmlBlock", function() {
  return gulp
    .src(["./build/*.html"])
    .pipe(
      htmlreplace({
        js: "assets/js/app.min.js",
        css: "assets/css/app.min.css"
      })
    )
    .pipe(gulp.dest("./"));
});

// Configure the browserSync task and watch file path for change
gulp.task("watch", function browserDev(done) {
  browserSync.init({
    server: {
      baseDir: "./build/"
    }
  });
  gulp.watch(
    [
      "build/assets/scss/*.scss",
      "build/assets/scss/**/*.scss",
      "!build/assets/scss/bootstrap/**"
    ],
    gulp.series("css:minify", function cssBrowserReload(done) {
      browserSync.reload();
      done(); //Async callback for completion.
    })
  );
  gulp.watch(
    "build/assets/js/app.js",
    gulp.series("js:minify", function jsBrowserReload(done) {
      browserSync.reload();
      done();
    })
  );
  gulp.watch(["*.html"]).on("change", browserSync.reload);
  done();
});

// Build task
gulp.task(
  "build",
  gulp.series(
    gulp.parallel("css:minify", "js:minify", "vendor"),
    "vendor:build",
    function copyAssets() {
      return gulp
        .src(["build/*.html", "build/favicon.ico", "build/assets/img/**"], { base: "./build/" })
        .pipe(imagemin())
        .pipe(gulp.dest("./"));
    }
  )
);

// Default task
gulp.task("default", gulp.series("clean", "build", "replaceHtmlBlock"));
