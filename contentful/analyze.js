const utils = require('./utils'),
    stockedProducts = require('../output/json/stockedProducts.json'),
    spec85285Products = require('../output/json/spec85285.json'),
    eclipseProducts = require('../output/json/eclipse.json'),
    _ = require('lodash');

// Grab all of the nested products, components, and subgroups
const products = _.flatten([
    utils.getNestedProducts(stockedProducts),
    utils.getNestedProducts(spec85285Products),
    utils.getNestedProducts(eclipseProducts),
]);

const components = utils.getNestedComponents(products);
const subGroups = utils.getSubGroups(products);
const pageGroupings = utils.getPageGroupings(products);

// We want products to be unique, so de-dup based on name/description
utils.uniqifyProducts(products);

const piFiles = utils.getPiFiles(products);
const msdsFiles = utils.getMsdsFiles(components);

console.log('Got products', products.length);
console.log('Got components', components.length);
console.log('Got page groups', pageGroupings);
console.log('Got sub groups', subGroups.length);
console.log('Got PI Files', piFiles.length);
console.log('Got MSDS Files', msdsFiles.length);

const fileSizes = _([ piFiles, msdsFiles ])
             .flatten()
             .map(utils.getFileSize)
             .reduce(utils.sum, 0);

console.log('Total file sizes', fileSizes);
