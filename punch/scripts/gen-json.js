var parse = require('csv-parse'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    argv = require('minimist')(process.argv.slice(2)),
    rows = [],
    foundHeader = false,
    group = null,
    inFile = argv.file,
    outFile = argv.outFile,
    outFile2 = argv.outFile2,
    shareGroupFiles = argv.shareGroupFiles === true,
    colWidth = _.isNumber(argv.colWidth) ? argv.colWidth : 6,
    useHalves = argv.productGrouping === 'half',
    useThirds = argv.productGrouping === 'third',
    dryRun = argv.dryRun != null,
    inFile,
    allFiles = [];

function dryRunLog(s) {
  if (dryRun) {
    console.log(s);
  }
}

function getAllFiles(rootDir) {
  var files = fs.readdirSync(rootDir);

  console.log('Loading directory ' + rootDir);
  _.each(files, function (file) {
    if (file[0] !== '.') {
      var filePath = path.join(rootDir, file);
      var stat = fs.statSync(filePath);

      if (stat.isFile()) {
        //console.log('Loaded file ' + filePath);
        allFiles.push(filePath);
      } else {
        getAllFiles(filePath);
      }
    }
  });
}

function appendRow(row) {
  if (!foundHeader) { foundHeader = true; return; }

  function fixFilename(file) {
    var toks, ext;

    function compareFilename(f) {
      return f === path.join('templates', file);
    }

    file = file.replace(/\\/g, '/');
    if (file.length > 0 && !_.find(allFiles, compareFilename)) {
      toks = file.split('.');
      if (toks.length > 1) {
        ext = toks.pop();
        if(/^[a-z]*$/.test(ext)) {
          ext = ext.toUpperCase();
        } else if(/^[A-Z]*$/.test(ext)) {
          ext = ext.toLowerCase();
        }
        toks.push(ext);
        file = toks.join('.');
        if (_.find(allFiles, compareFilename)) {
          dryRunLog('Fixed ' + file);
        } else {
          dryRunLog('Unable to fix ' + file);
        }
      } else {
        dryRunLog('not enough toks! ' + file);
      }
    }
    return file;
  }

  var obj = {
    name: row[0],
    desc: row[1],
    file: fixFilename(row[2]),
    components: [],
    manufacturer: row[11],
    type: row[12],
    shareGroupFiles: shareGroupFiles
  };

  if (obj.name === '') { return; }

  if (obj.file === '' ) {
    group = obj.name;
    return;
  }

  obj.group = group;

  function addComponent(row, i) {
    if (row[i] && row[i].trim().length > 0) {
      obj.components.push({
        name: row[i++],
        file: fixFilename(row[i])
      });
    }
  }

  addComponent(row, 3);
  addComponent(row, 5);
  addComponent(row, 7);
  addComponent(row, 9);

  console.log('Processed ' + obj.name);
  rows.push(obj);
}

function splitByManufacturerAndType(rows) {
  var json = {};

  function byGroup(arr, g) {
    if (g === 'undefined' || g === 'null') { g = null; }
    return { group: g,
             shareGroupFiles: shareGroupFiles,
             useHalves: useHalves,
             useThirds: useThirds,
             products: arr };
  }

  function byCategory(arr, c) {
    arr = _(arr).groupBy('group')
                .map(byGroup)
                .value();

    if (c === 'undefined') { c = "Miscellaneous"; }
    return { category: c,
             colWidth: colWidth,
             groups: arr };
  }

  json.byManufacturer = _(rows).groupBy('manufacturer')
                               .map(byCategory)
                               .value();

  json.byType = _(rows).groupBy('type')
                       .map(byCategory)
                       .value();

  return json;
}

function orderByLengthForLayout(categoryArr, overrideFirstCat) {
  var numProducts,
      left = [],
      right = [];

  // Find out how many products are nested inside the category
  numProducts = _.pluck(categoryArr, function (c) {
    c.numProducts = _(c.groups).pluck(function(g) { return g.products.length; })
                               .reduce(function(a, b) { return a + b; });
    // Add number of groups to the length to balance that spacing out
    c.numProducts += c.groups.length;
    return c.numProducts;
  });

  // Sort lengths in descending order
  numProducts = numProducts.sort(function (a, b) {
    a = parseInt(a, 10);
    b = parseInt(b, 10);
    return a > b ? -1 : b > a ? 1 : 0;
  });

  function sum(arr) {
    if (arr.length === 0) { return 0; }
    return _.reduce([0].concat(arr), function (a, b) {
      return a + b.numProducts;
    });
  }

  function find(len) {
    var index = _.findIndex(categoryArr, { numProducts: len });
    return categoryArr.splice(index, 1)[0];
  }

  // If we need to put a specific category first, remove it from the array here
  // and add to the left side
  overrideFirstCat = _.findIndex(categoryArr, { category: overrideFirstCat });
  if (overrideFirstCat >= 0) {
    left.push(categoryArr.splice(overrideFirstCat, 1)[0]);
    numProducts = _.without(numProducts, left[0].numProducts);
  }

  while (numProducts.length > 0) {
    var len = numProducts.shift(),
        leftLen = sum(left),
        rightLen = sum(right),
        delta = leftLen - rightLen;

    if (delta <= 0) {
      //Columns are equal, or right has more, add to the left
      left.push(find(len));
    } else {
      // Left has more than right, add to right
      right.push(find(len));
    }
  }

  return [ left, right ];
}

function processRows() {
  var json = splitByManufacturerAndType(rows);

  json.byManufacturer = orderByLengthForLayout(json.byManufacturer, 'AkzoNobel');
  json.byType = orderByLengthForLayout(json.byType);

  if (!dryRun) {
    console.log('Writing output to ' + outFile);
    console.log('Writing output to ' + outFile2);
    fs.writeFileSync(outFile, JSON.stringify(json, null, "  "));
    fs.writeFileSync(outFile2, JSON.stringify(json, null, "  "));
  }
}

if (!inFile || !outFile) {
  console.log("  Usage: " + process.argv[0] + " " + process.argv[1] + " --file <csvFile> --outFile <jsonFile> [--shareGroupFiles] [--colWidth <n>] [--productGrouping half|third]");
  process.exit(1);
}

getAllFiles(path.join('templates', 'All Suppliers -TB and MSDS'));

var input = fs.readFileSync(inFile);
parse(input, { trim: true, skip_empty_lines: true }, function(err, output){
  _.each(output, appendRow);
  processRows();
});

