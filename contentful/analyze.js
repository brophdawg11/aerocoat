var fs = require('fs-extra'),
    constants = require('./constants'),
    csvProducts = {
        stockedProducts: require('../punch/output/json/stockedProducts.json'),
        spec85285: require('../punch/output/json/spec85285.json'),
        eclipse: require('../punch/output/json/eclipse.json')
    },
    _ = require('lodash'),
    products,
    components,
    subGroups,
    piFiles,
    msdsFiles,
    fileSizes,
    sum = (a, b) => a + b;

// Grab all of the nested products, components, and subgroups
products = _.flatten([
    getNestedProducts(csvProducts.stockedProducts),
    getNestedProducts(csvProducts.spec85285),
    getNestedProducts(csvProducts.eclipse),
]);

components = getNestedComponents(products);
subGroups = getSubGroups(products);

// We want products to be unique, so de-dup based on name/description
uniqifyProducts(products);

piFiles = getPiFiles(products);
msdsFiles = getMsdsFiles(components);

console.log('Got products', products.length);
console.log('Got components', components.length);
console.log('Got groups', subGroups.length);
console.log('Got PI Files', piFiles.length);
console.log('Got MSDS Files', msdsFiles.length);

fileSizes = _([ piFiles, msdsFiles ])
             .flatten()
             .map(getFileSize)
             .reduce(sum, 0);

console.log('Total file sizes', fileSizes);

function getNestedProducts(productData) {
    return _(productData.byManufacturer)
            .flatMap()
            .map('groups')
            .flatten()
            .map('products')
            .tap(uniqifyProducts)
            .flatten()
            .value();
}

function uniqifyProducts(products) {
    _(products)
     .groupBy(p => `${p.name}|${p.desc}`)
     .filter(g => g.length > 1)
     .each(g => {
         _.each(g, (g, i) => g.name += ` - Dup ${i}`)
     });
}

function getPiFiles(products) {
    return _(products)
            .map('file')
            .compact()
            .uniq()
            .value();
}

function getFileSize(filePath) {
    fs.copySync('../punch/templates/' + filePath,
                './files/' + filePath);
    return fs.statSync('../punch/templates/' + filePath).size;
}

function getNestedComponents(products) {
    return _(products)
            .map('components')
            .flatten()
            .uniqBy('name')
            .value();
}

function getMsdsFiles(components) {
    return _(components)
            .map('file')
            .compact()
            .uniq()
            .value();
}

function getSubGroups(products) {
    return _(products)
            .map('group')
            .uniq()
            .compact()
            .value();
}

function str(data) {
    return JSON.stringify(data, null, '    ');
}
