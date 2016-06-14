var exec = require('child_process').exec

var gulp = require('gulp')
var gulpsync = require('gulp-sync')(gulp)
var ghPages = require('gulp-gh-pages')
var surge = require('gulp-surge')

// npm run build
gulp.task('build-dapple', function (cb) {
  exec('dapple build --template meteor --no-deploy-data', function (err, res, failed) {
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
  return gulp.src('./dist/**/*')
    .pipe(ghPages())
})

gulp.task('deploy-surge', [], function () {
  return surge({
    project: './dist',          // Path to your static build directory
    domain: 'maker-market.surge.sh'  // Your domain or Surge subdomain
  })
})

gulp.task('deploy', gulpsync.sync(['build-dapple', 'build-meteor', 'deploy-surge']))
