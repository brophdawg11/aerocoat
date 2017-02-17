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
       .then(createPageGroupings)
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

function createPageGroupingEntry(pageGrouping) {
    if (_.find(existingData.pageGroupings, { name: pageGrouping.name })) {
        console.log(`Skipping upload for existing entry: ${pageGrouping.name}`);
        return Promise.resolve();
    }

    const data = {
        fields: {
            name: utils.localize(pageGrouping.name),
            title: utils.localize(pageGrouping.title),
            page: utils.localize(pageGrouping.page),
            groupWidth: utils.localize(pageGrouping.groupWidth),
            columns: utils.localize(pageGrouping.columns),
        },
    };

    console.log(`Creating pageGrouping entry for group: ${pageGrouping.name}`);
    console.log(`  contentTypeId: ${constants.contentTypes.pageGrouping}`);
    console.log('  data', data);

    if (dryRun) {
        return Promise.resolve();
    }

    return space.createEntry(constants.contentTypes.pageGrouping, data)
                .then((entry) => {
                    console.log('    Entry created');
                    return entry.publish();
                });
}

function createPageGroupings() {
    const steps = _(globalData.pageGroupings)
                   .map(g => [
                       _.partial(createPageGroupingEntry, g),
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

