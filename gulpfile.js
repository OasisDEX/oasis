var exec = require('child_process').exec

var gulp = require('gulp')
var gulpsync = require('gulp-sync')(gulp)
var ghPages = require('gulp-gh-pages')
var surge = require('gulp-surge')
var rename = require('gulp-rename');

// npm run build
gulp.task('build-dapp-maker-otc', function (cb) {
  exec('dapp build && dapp bind', {cwd: 'dependencies/maker-otc'}, function (err, res, failed) {
    if (err) {
      console.log(err)
    } else if (failed) {
      process.stdout.write(failed)
    } else {
      process.stdout.write('\u001b[32mdapp build completed!\n')
    }
    cb(err)
  })
})

gulp.task('copy-dapp-maker-otc', ['build-dapp-maker-otc'], function (){
  return gulp.src([
      'dependencies/maker-otc/build/dapp.js'
  ])
  .pipe(rename('maker-otc.js'))
  .pipe(gulp.dest('frontend/packages/dapp/build/'))
})

gulp.task('build-dapp-token-wrapper', function (cb) {
  exec('dapp build && dapp bind', {cwd: 'dependencies/token-wrapper'}, function (err, res, failed) {
    if (err) {
      console.log(err)
    } else if (failed) {
      process.stdout.write(failed)
    } else {
      process.stdout.write('\u001b[32mdapp build completed!\n')
    }
    cb(err)
  })
})

gulp.task('copy-dapp-token-wrapper', ['build-dapp-token-wrapper'], function (){
  return gulp.src([
      'dependencies/token-wrapper/build/dapp.js'
  ])
  .pipe(rename('token-wrapper.js'))
  .pipe(gulp.dest('frontend/packages/dapp/build/'))
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
  require('fs').writeFileSync('./dist/CNAME', 'pro.oasisdex.com');
  return gulp.src('./dist/**/*')
    .pipe(ghPages())
})

gulp.task('deploy-surge', [], function () {
  return surge({
    project: './dist',          // Path to your static build directory
    domain: 'oasis-pro.surge.sh'  // Your domain or Surge subdomain
  })
})

gulp.task('build-dapp', ['copy-dapp-maker-otc', 'copy-dapp-token-wrapper'])
gulp.task('deploy', gulpsync.sync(['build-dapp', 'build-meteor', 'deploy-gh-pages']))

gulp.task('build', ['build-dapp'])
gulp.task('default', ['build'])
