const fs = require('fs-extra'),
    contentfulDelivery = require('contentful'),
    contentfulManagement = require('contentful-management'),
    constants = require('./constants'),
    stockedProducts = require('../output/json/stockedProducts.json'),
    spec85285Products = require('../output/json/spec85285.json'),
    eclipseProducts = require('../output/json/eclipse.json'),
    _ = require('lodash'),
    dryRun = process.argv[2] === '--dry-run';


function createDeliveryClient() {
    return contentfulDelivery.createClient({
        space: constants.spaceId,
        accessToken: constants.accessToken,
    });
}

function createManagementClient() {
    return contentfulManagement.createClient({
        accessToken: constants.oauthToken,
    });
}

function getSpace() {
    console.log('Setting up contentful space client');
    if (!dryRun) {
        return createManagementClient().getSpace(constants.spaceId);
    }
    return Promise.resolve();
}

function getGlobalData() {
    // Grab all of the nested products, components, and subgroups
    const products = _.flatten([
        getNestedProducts(stockedProducts),
        getNestedProducts(spec85285Products),
        getNestedProducts(eclipseProducts),
    ]);
    const components = getNestedComponents(products);
    const subGroups = getSubGroups(products);
    const pageGroupings = getPageGroupings();
    const piFiles = getFiles(products);
    const msdsFiles = getFiles(components);

    // We want products to be unique, so de-dup based on name/description
    const uniqueProducts = uniqifyProducts(_.cloneDeep(products));

    return {
        components,
        products,
        uniqueProducts,
        subGroups,
        pageGroupings,
        piFiles,
        msdsFiles
    };
}

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
     .each((g) => {
         _.each(g, (_g, i) => { _g.name += ` - Dup ${i}`; });
     });
}

function getNestedComponents(products) {
    return _(products)
            .map('components')
            .flatten()
            .uniqBy('name')
            .value();
}

function getSubGroups(products) {
    return _(products)
            .map('group')
            .uniq()
            .compact()
            .value();
}

function getPageGroupings() {
    return _.flatten([

        _(stockedProducts.byManufacturer)
         .flatten()
         .map(g => ({
             name: `Stocked Products - Manufacturer - ${g.category}`,
             title: g.category,
             page: constants.pages.stockedProducts,
             groupWidth: g.colWidth === 6 ? 'Half-page' : 'Full-page',
             columns: 1,
         }))
         .value(),

        _(stockedProducts.byType)
         .flatten()
         .map(g => ({
             name: `Stocked Products - Mil-spec - ${g.category}`,
             title: g.category,
             page: constants.pages.stockedProducts,
             groupWidth: g.colWidth === 6 ? 'Half-page' : 'Full-page',
             columns: 1,
         }))
         .value(),

        _(spec85285Products.byManufacturer)
         .flatten()
         .map(g => ({
             name: `85285 Colors - Manufacturer - ${g.category}`,
             title: g.category,
             page: constants.pages.spec85285,
             groupWidth: g.colWidth === 6 ? 'Half-page' : 'Full-page',
             columns: 2,
         }))
         .value(),

        _(spec85285Products.byType)
         .flatten()
         .map(g => ({
             name: `85285 Colors - Finish - ${g.category}`,
             title: g.category,
             page: constants.pages.spec85285,
             groupWidth: g.colWidth === 6 ? 'Half-page' : 'Full-page',
             columns: 2,
         }))
         .value(),

        _(eclipseProducts.byManufacturer)
         .flatten()
         .map(g => ({
             name: 'Eclipse Colors',
             title: g.category,
             page: constants.pages.eclipse,
             groupWidth: g.colWidth === 6 ? 'Half-page' : 'Full-page',
             columns: 3,
         }))
         .value(),

    ]);
}

function getFiles(productsOrComponents) {
    return _(productsOrComponents)
            .map('file')
            .compact()
            .uniq()
            .value();
}

function getFileSize(filePath) {
    fs.copySync(`../punch/templates/${filePath}`,
                `./files/${filePath}`);
    return fs.statSync(`../punch/templates/${filePath}`).size;
}

function flowAsync() {
    const arr = Array.prototype.slice.call(arguments);
    const next = (fn, data) => {
        return typeof fn === 'object' && fn.hasOwnProperty('length') ?
                 flowAsync.apply(this, fn)(data) :
                 promisify(fn.call(this, data));
    };
    const reducer = (accum, fn) => accum.then(next.bind(this, fn));
    return value => arr.reduce(reducer.bind(this), Promise.resolve(value));
}

function localize(s) {
    return {
        'en-US': s,
    };
}

function promisify(val) {
    return val && typeof val.then === 'function' ?
             val :
             Promise.resolve(val);
}

function delay(n) {
    return new Promise((resolve) => {
        setTimeout(resolve, n);
    });
}

function str(data) {
    return JSON.stringify(data, null, '    ');
}

function sum(a, b) {
    return a + b;
}

module.exports = {
    createDeliveryClient,
    createManagementClient,
    getSpace,

    getGlobalData,
    getNestedComponents,
    getNestedProducts,
    getSubGroups,
    getPageGroupings,
    uniqifyProducts,
    getFiles,
    getFileSize,

    delay,
    flowAsync,
    localize,
    promisify,
    str,
    sum,
};
