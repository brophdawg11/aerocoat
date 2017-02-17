const constants = require('../constants'),
    utils = require('../utils'),
    loadContent = require('../load-content'),
    globalData = utils.getGlobalData(),
    _ = require('lodash'),
    dryRun = process.argv[2] === '--dry-run';

let space,
    existingData;

console.log('Dry Run:', dryRun);

Promise.resolve()
       .then(loadExistingData)
       .then(setupSpace)
       .then(createProducts)
       .then(successHandler)
       .catch(errorHandler);

function loadExistingData() {
    return loadContent
               .loadAllExistingData()
               .then((data) => { existingData = data; })
               .then(() => console.log('Existing Data', utils.str(existingData)));
}

function setupSpace() {
    return utils.getSpace().then((s) => { space = s; });
}

function createProduct(product) {
    if (_.find(existingData.products, { name: product.name })) {
        console.log(`Skipping upload for existing entry: ${product.name}`);
        return Promise.resolve();
    }

    function findAsset(filePath) {
        return _.find(existingData.assets,
                      { fields: { description: filePath } });
    }

    function findComponent(component) {
        return _.find(existingData.components,
                      { name: component.name });
    }

    function findPageGrouping(_product, field) {
        return _.find(existingData.pageGroupings,
                      { name: _product[field] });
    }

    function findSubGroup(_product) {
        return _.find(existingData.subGroups,
                      { name: _product.group });
    }

    function getEntryLink(entry) {
        return {
            'en-US': {
                sys: {
                    type: 'Link',
                    linkType: 'Entry',
                    id: _.get(entry, '_sys.id'),
                },
            },
        };
    }

    const data = {
        fields: {
            name: utils.localize(product.name),
            description: utils.localize(product.desc),
            primaryGroup: getEntryLink(findPageGrouping(product, 'primaryGroup')),
            secondaryGroup: getEntryLink(findPageGrouping(product, 'secondaryGroup')),
            subGroup: getEntryLink(findSubGroup(product)),
        },
    };

    if (product.file) {
        // // HACK: match existing asset
        // product.file = 'All Suppliers -TB and MSDS/AKZO/PI Sheets/422X Series.pdf';

        data.fields.technicalDataSheet = {
            'en-US': {
                sys: {
                    type: 'Link',
                    linkType: 'Asset',
                    id: findAsset(product.file).sys.id,
                },
            },
        };
    }

    data.fields.components = {
        'en-US': product.components.map((component) => {
            // // HACK: match existing component
            // component.name = '4222T17178';

            return {
                sys: {
                    type: 'Link',
                    linkType: 'Entry',
                    id: _.get(findComponent(component), '_sys.id'),
                },
            };
        }),
    };

    console.log(`Creating product entry: ${product.name}`);
    console.log(`  contentTypeId: ${constants.contentTypes.product}`);
    console.log('  data', utils.str(data));

    if (dryRun) {
        return Promise.resolve();
    }

    return space.createEntry(constants.contentTypes.product, data)
                .then((entry) => {
                    console.log('    Entry created');
                    return entry.publish();
                });
}

function createProducts() {
    const steps = _(globalData.products)
                   .take(2)
                   .tail()
                   .map(g => [
                       _.partial(createProduct, g),
                       _.partial(utils.delay, 250),
                   ])
                   .flatten()
                   .value();
    return utils.flowAsync(steps)();
}

function successHandler() {
    console.log('SUCCESS');
}

function errorHandler(err) {
    console.error('ERROR');
    console.error(err);
}

