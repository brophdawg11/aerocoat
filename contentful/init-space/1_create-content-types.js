const constants = require('../constants'),
    loadContent = require('../load-content'),
    utils = require('../utils'),
    _ = require('lodash'),
    dryRun = process.argv[2] === '--dry-run';

let existingData,
    space;

console.log('Dry Run:', dryRun);

Promise.resolve()
       .then(loadExistingData)
       .then(setupSpace)
       .then(createContentTypes)
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

function createContentType(contentType) {
    if (_.find(existingData.contentTypes, { sys: { id: contentType } })) {
        console.log(`Skipping upload for existing Content Type: ${contentType}`);
        return Promise.resolve();
    }

    const data = require(`./data/content-type--${contentType}`);

    console.log(`Creating Content Type: ${contentType}`);
    console.log('  data', data);

    if (dryRun) {
        return Promise.resolve();
    }

    return space.createContentTypeWithId(contentType, data)
                .then((entry) => {
                    console.log('    Content Type created');
                    return entry.publish();
                });
}

function createContentTypes() {
    const steps = _(constants.contentTypes)
                 .map(type => [
                     _.partial(createContentType, type),
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

