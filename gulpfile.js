var exec = require('child_process').exec

var gulp = require('gulp')
var gulpsync = require('gulp-sync')(gulp)
var ghPages = require('gulp-gh-pages')
var surge = require('gulp-surge')
var rename = require('gulp-rename');

// npm run build
gulp.task('build-dapple-maker-otc', function (cb) {
  exec('dapple build --template meteor --no-deploy-data', {cwd: 'dapple_packages/maker-otc'}, function (err, res, failed) {
    if (err) {
      console.log(err)
    } else if (failed) {
      process.stdout.write(failed)
    } else {
      process.stdout.write('\u001b[32mDapple build completed!\n')
    }
    cb(err)
  })
})

gulp.task('copy-dapple-maker-otc', ['build-dapple-maker-otc'], function (){
  return gulp.src([
      'dapple_packages/maker-otc/build/meteor.js'
  ])
  .pipe(rename('maker-otc.js'))
  .pipe(gulp.dest('frontend/packages/dapple/build/'))
})

gulp.task('build-dapple-token-wrapper', function (cb) {
  exec('dapple build --template meteor --no-deploy-data', {cwd: 'dapple_packages/token-wrapper'}, function (err, res, failed) {
    if (err) {
      console.log(err)
    } else if (failed) {
      process.stdout.write(failed)
    } else {
      process.stdout.write('\u001b[32mDapple build completed!\n')
    }
    cb(err)
  })
})

gulp.task('copy-dapple-token-wrapper', ['build-dapple-token-wrapper'], function (){
  return gulp.src([
      'dapple_packages/token-wrapper/build/meteor.js'
  ])
  .pipe(rename('token-wrapper.js'))
  .pipe(gulp.dest('frontend/packages/dapple/build/'))
})

// meteor-build-client ../build
gulp.task('build-meteor', function (cb) {
  exec('meteor-build-client ../dist --path ""', {cwd: 'frontend'}, function (err, res, failed) {
    if (err) {
      console.log(err)
    } else if (failed) {
      process.stdout.write(failed)
    } else {
      process.stdout.write('\u001b[32mMeteor build completed!\n')
    }
    cb(err)
  })
})

// gh-pages
gulp.task('deploy-gh-pages', function () {
  require('fs').writeFileSync('./dist/CNAME', 'plus.oasisdex.com');
  return gulp.src('./dist/**/*')
    .pipe(ghPages())
})

gulp.task('deploy-surge', [], function () {
  return surge({
    project: './dist',          // Path to your static build directory
    domain: 'oasis-plus.surge.sh'  // Your domain or Surge subdomain
  })
})

gulp.task('build-dapple', ['copy-dapple-maker-otc', 'copy-dapple-token-wrapper'])
gulp.task('deploy', gulpsync.sync(['build-dapple', 'build-meteor', 'deploy-gh-pages']))

gulp.task('build', ['build-dapple'])
gulp.task('default', ['build'])
