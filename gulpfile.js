/*
 * common
 */
const gulp = require( 'gulp' );
const plumber = require( 'gulp-plumber' );
const notify = require('gulp-notify');
const data = require('gulp-data');
/*
 * sass
 */
const gulpSass = require('gulp-sass');
const autoprefixer = require( 'gulp-autoprefixer' );
/*
 * ejs
 */
const ejs = require('gulp-ejs');
const rename = require( 'gulp-rename' );

// watch
gulp.task( 'default', function() {
  gulp.watch(['app/sass/*.scss', '!node_modules'], ['sass']);
  gulp.watch(['app/ejs/*.ejs', 'app/ejs/**/*.ejs'], ['ejs']);
});


// transfer sass to css
gulp.task( 'sass', function() {
  gulp.src( 'app/sass/*.scss' )
    .pipe(plumber({errorHandler: notify.onError('<%- error.message %>')}))
    .pipe(gulpSass())
    .pipe(autoprefixer())
    .pipe(gulp.dest('app/css'));
});

// transfer ejs to html
gulp.task( 'ejs', function() {
  gulp.src(
    ['app/ejs/*.ejs', 'app/ejs/**/*.ejs', '!' + 'app/ejs/**/_*.ejs']
  )
    .pipe(plumber({errorHandler: notify.onError('<%- error.message %>')}))
    .pipe( data( (file) => {
      return {'filePath': file.path};
    }))
    .pipe( ejs() )
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest('app/'));
});
