var fs = require('fs-extra'),
    _ = require('lodash'),
    argv = require('minimist')(process.argv.slice(2)),
    glob = require('glob'),
    files;

if (!argv.file) {
  console.error('No --file specified for clean-output.js!');
  return process.exit(1);
}

files = glob.sync(argv.file);

_.each(files, function (f) {
  console.log("Cleaning up " + f);

  fs.removeSync(f, function (err) {
    if (err) {
      console.error(err);
      return process.exit(1);
    }
  });
});
