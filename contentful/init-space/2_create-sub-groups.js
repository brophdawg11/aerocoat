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
       .then(createSubGroups)
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

function createSubGroupEntry(subGroup) {
    if (_.find(existingData.subGroups, { name: subGroup })) {
        console.log(`Skipping upload for existing entry: ${subGroup}`);
        return Promise.resolve();
    }

    const data = {
        fields: {
            name: utils.localize(subGroup),
            description: utils.localize(subGroup),
        },
    };

    console.log(`Creating subgroup entry for group: ${subGroup}`);
    console.log(`  contentTypeId: ${constants.contentTypes.subGroup}`);
    console.log('  data', data);

    if (dryRun) {
        return Promise.resolve();
    }

    return space.createEntry(constants.contentTypes.subGroup, data)
                .then((entry) => {
                    console.log('    Entry created');
                    return entry.publish();
                });
}

function createSubGroups() {
    const steps = _(globalData.subGroups)
                   .map(g => [
                       _.partial(createSubGroupEntry, g),
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

