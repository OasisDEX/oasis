var exec = require('child_process').exec

var gulp = require('gulp')
var gulpsync = require('gulp-sync')(gulp)
var ghPages = require('gulp-gh-pages')
var surge = require('gulp-surge')
var rename = require('gulp-rename');

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
  require('fs').writeFileSync('./dist/CNAME', 'oasisdex.com');
  return gulp.src('./dist/**/*')
    .pipe(ghPages())
})

gulp.task('deploy-surge', [], function () {
  return surge({
    project: './dist',          // Path to your static build directory
    domain: 'https://oasisdex.surge.sh'  // Your domain or Surge subdomain
  })
})

gulp.task('deploy', gulpsync.sync(['build-meteor', 'deploy-gh-pages']))
