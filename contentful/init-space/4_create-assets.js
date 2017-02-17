const fs = require('fs-extra'),
    path = require('path'),
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
       .then(createAssets)
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

function getContentType(filePath) {
    if (/\.pdf$/i.test(filePath)) {
        return 'application/pdf';
    }

    if (/\.doc$/i.test(filePath)) {
        return 'application/msword';
    }

    if (/\.docx$/i.test(filePath)) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    throw new Error(`Unknown content type ${filePath}`);
}

function createAsset(filePath) {
    if (_.find(existingData.assets, { fields: { description: filePath } })) {
        console.log(`Skipping upload for existing asset: ${filePath}`);
        return Promise.resolve();
    }

    const encodedPath = escape(filePath);
    const basename = path.basename(filePath);
    const data = {
        fields: {
            file: {
                'en-US': {
                    contentType: getContentType(filePath),
                    fileName: basename,
                    upload: `http://ghpages.aerocoat.com/${encodedPath}`,
                },
            },
        },
    };

    console.log(`Creating asset: ${filePath}`);
    console.log('  data', utils.str(data));

    if (dryRun) {
        return Promise.resolve();
    }

    return space.createAsset(data)
                .then((asset) => {
                    console.log('    Asset created');
                    asset.fields.title = utils.localize(basename);
                    asset.fields.description = utils.localize(filePath);
                    return asset.update();
                })
                .then((asset) => {
                    console.log('    Asset title/description added');
                    return asset.processForLocale('en-US', {
                        processingCheckWait: 60000,
                        processingCheckRetries: 3,
                    });
                })
                .then((asset) => {
                    console.log('    Asset processed');
                    return asset.publish();
                });
}

function createAssets() {
    const steps = _([ globalData.piFiles, globalData.msdsFiles ])
                   .flatten()
                   .map(f => [
                       _.partial(createAsset, f),
                       _.partial(utils.delay, 1000),
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

