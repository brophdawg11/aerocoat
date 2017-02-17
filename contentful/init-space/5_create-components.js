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
       .then(createComponents)
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

function createComponent(component) {
    if (_.find(existingData.components, { name: component.name })) {
        console.log(`Skipping upload for existing entry: ${component.name}`);
        return Promise.resolve();
    }

    function findAsset(filePath) {
        return _.find(existingData.assets,
                      { fields: { description: filePath } });
    }

    // // HACK: match existing asset
    // component.file = 'All Suppliers -TB and MSDS/AKZO/PI Sheets/422X Series.pdf';

    const data = {
        fields: {
            name: utils.localize(component.name),
            msds: {
                'en-US': {
                    sys: {
                        type: 'Link',
                        linkType: 'Asset',
                        id: findAsset(component.file).sys.id,
                    },
                },
            },
        },
    };

    console.log(`Creating component entry: ${component.name}`);
    console.log(`  contentTypeId: ${constants.contentTypes.component}`);
    console.log('  data', data);

    if (dryRun) {
        return Promise.resolve();
    }

    return space.createEntry(constants.contentTypes.component, data)
                .then((entry) => {
                    console.log('    Entry created');
                    return entry.publish();
                });
}

function createComponents() {
    const steps = _(globalData.components)
                   .map(g => [
                       _.partial(createComponent, g),
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

