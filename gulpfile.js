"use strict";

// Load plugins
import autoprefixer from "gulp-autoprefixer";
import browserSyncLib from "browser-sync";
import cleanCSS from "gulp-clean-css";
import { deleteAsync } from "del";
import gulp from "gulp";
import header from "gulp-header";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import uglify from "gulp-uglify";
import { readFileSync } from "node:fs";

const browsersync = browserSyncLib.create();
const sass = gulpSass(dartSass);

// Load package.json for banner
const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

// Set the banner content
const banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  '\n'
].join('');

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

// BrowserSync reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean vendor
function clean() {
  return deleteAsync(["./vendor/"]);
}

// Bring third party dependencies from node_modules into vendor directory
// (encoding: false keeps binary files such as webfonts intact under gulp 5)
const bootstrap = () => gulp.src('./node_modules/bootstrap/dist/**/*', { encoding: false })
  .pipe(gulp.dest('./vendor/bootstrap'));
const fontAwesomeCSS = () => gulp.src('./node_modules/@fortawesome/fontawesome-free/css/**/*')
  .pipe(gulp.dest('./vendor/fontawesome-free/css'));
const fontAwesomeWebfonts = () => gulp.src('./node_modules/@fortawesome/fontawesome-free/webfonts/**/*', { encoding: false })
  .pipe(gulp.dest('./vendor/fontawesome-free/webfonts'));
const jquery = () => gulp.src([
    './node_modules/jquery/dist/*',
    '!./node_modules/jquery/dist/core.js'
  ], { encoding: false })
  .pipe(gulp.dest('./vendor/jquery'));
const modules = gulp.parallel(bootstrap, fontAwesomeCSS, fontAwesomeWebfonts, jquery);

// CSS task
function css() {
  return gulp
    .src("./scss/**/*.scss")
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded",
      includePaths: ["./node_modules"],
      silenceDeprecations: ["import", "global-builtin", "color-functions", "mixed-decls"],
    }))
    .on("error", sass.logError)
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest("./css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./css"))
    .pipe(browsersync.stream());
}

// JS task
function js() {
  return gulp
    .src([
      './js/*.js',
      '!./js/*.min.js',
      '!./js/contact_me.js',
      '!./js/jqBootstrapValidation.js'
    ])
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./js'))
    .pipe(browsersync.stream());
}

// Watch files
function watchFiles() {
  gulp.watch("./scss/**/*", css);
  gulp.watch(["./js/**/*", "!./js/**/*.min.js"], js);
  gulp.watch("./**/*.html", browserSyncReload);
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, gulp.parallel(css, js));
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
export { css, js, clean, vendor, build, watch };
export default build;
