var contentful = require('contentful-management'),
    constants = require('./constants'),
    contents = require('./load-content'),
    // csvProducts = require('../punch/output/json/stockedProducts.json'),
    // csvProducts = require('../punch/output/json/spec85285.json'),
    csvProducts = require('../punch/output/json/eclipse.json'),
    _ = require('lodash'),
    client = createClient(),
    existingData = {},
    space,
    products,
    components,
    subGroups,
    dryRun = process.argv[2] === '--dry-run';

console.log('Dry Run:', dryRun);

Promise.resolve()
       .then(loadExistingData)
       .then(setupGlobalData)
       .then(setupSpace)
       .then(createSubGroups)
       .then(successHandler)
       .catch(errorHandler);

function createClient() {
    return contentful.createClient({
        accessToken: constants.oauthToken
    });
}

function loadExistingData() {
    return contents.loadSubGroups()
                   .then(g => { existingData.subGroups = g })
                   .then(e => console.log('Existing Data', str(existingData)));
}

function setupGlobalData() {
    // Grab all of the nested products, components, and subgroups
    products = getNestedProducts(csvProducts);
    components = getNestedComponents(products);
    subGroups = getSubGroups(products);

    // We want products to be unique, so de-dup based on name/description
    uniqifyProducts(products);

    console.log('Got products', products.length);
    console.log('Got components', components.length);
    console.log('Got groups', subGroups.length);

    return Promise.resolve();

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
}

function setupSpace() {
    console.log('Setting up contentful space client');
    if (!dryRun) {
        return client.getSpace(constants.spaceId).then(s => space = s);
    }
    return Promise.resolve();
}

function createSubGroupEntry(subGroup) {
    var data;

    if (_.find(existingData.subGroups, { name: subGroup })) {
        console.log(`Skipping upload for existing entry: ${subGroup}`);
        return Promise.resolve();
    }

    data = {
        fields: {
            name: localize(subGroup),
            description: localize(subGroup)
        }
    };

    console.log(`Creating subgroup entry for group: ${subGroup}`);
    console.log(`  contentTypeId: ${constants.contentTypes.subGroup}`);
    console.log('  data', data);

    if (dryRun) {
        return Promise.resolve();
    }

    return space.createEntry(constants.contentTypes.subGroup, data)
                .then(entry => {
                    console.log('    Entry created');
                    return entry.publish();
                });
}

function createSubGroups() {
    var steps = _(subGroups)
                 .map(g => [
                      _.partial(createSubGroupEntry, g),
                      _.partial(delay, 250)
                 ])
                 .flatten()
                 .value();
    return flowAsync(steps)();
}

function localize(str) {
    return {
        'en-US': str
    };
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

function promisify(val) {
    return val && typeof val.then === 'function' ?
             val :
             Promise.resolve(val);
}

// Return a promise to be resolved in n milliseconds
function delay(n) {
    return new Promise(resolve => {
        setTimeout(resolve, n)
    });
}

function str(data) {
    return JSON.stringify(data, null, '    ');
}

function successHandler() {
    console.log('SUCCESS');
}

function errorHandler(err) {
    console.error('ERROR');
    console.error(err);
}


