const contentful = require('contentful'),
    Resentful = require('resentful'),
    constants = require('./constants'),
    utils = require('./utils'),
    resentful = new Resentful(),
    client = createClient(),
    _ = require('lodash'),
    loadContent = {
        loadAllExistingData,
        loadSubGroups,
        loadContentTypes,
        loadPageGroupings,
        loadAssets,
        loadComponents,
        loadProducts,
    };

resentful.registerMappers(
    constants.contentTypes.component,
    entry => _.set(entry, 'fields._sys.id', _.get(entry, 'sys.id')));

resentful.registerMappers(
    constants.contentTypes.subGroup,
    entry => _.set(entry, 'fields._sys.id', _.get(entry, 'sys.id')));

resentful.registerMappers(
    constants.contentTypes.pageGrouping,
    entry => _.set(entry, 'fields._sys.id', _.get(entry, 'sys.id')));

function createClient() {
    return contentful.createClient({
        space: constants.spaceId,
        accessToken: constants.accessToken,
    });
}

function loadAllExistingData() {
    const promises = [
        loadContent.loadContentTypes(),
        loadContent.loadSubGroups(),
        loadContent.loadPageGroupings(),
        loadContent.loadAssets(),
        loadContent.loadComponents(),
        loadContent.loadProducts(),
    ];
    return Promise.all(promises)
                  .then((results) => {
                      return {
                          contentTypes: results[0],
                          subGroups: results[1],
                          pageGroupings: results[2],
                          assets: results[3],
                          components: results[4],
                          products: results[5],
                      };
                  })
                  .then((data) => {
                      console.log('Loaded existing data', str(data));
                      return data;
                  });
}

function loadProducts() {
    return client.getEntries({ content_type: constants.contentTypes.product })
                 .then((response) => {
                     console.log('\n\nproducts response', utils.str(response));
                     return resentful.reduceSingle(_.get(response, 'items'));
                 });
}

function loadComponents() {
    return client.getEntries({ content_type: constants.contentTypes.component })
                 .then((response) => {
                     console.log('\n\ncomponents response', response);
                     return resentful.reduceSingle(_.get(response, 'items'));
                 });
}

function loadSubGroups() {
    return client.getEntries({ content_type: constants.contentTypes.subGroup })
                 .then((response) => {
                     console.log('\n\nsubGroups response', response);
                     return resentful.reduceSingle(_.get(response, 'items'));
                 });
}

function loadAssets() {
    return client.getAssets()
                 .then((response) => {
                     console.log('\n\nassets response', response);
                     return _.get(response, 'items');
                 });
}

function loadSubGroups() {
    return client.getEntries({ content_type: constants.contentTypes.subGroup })
                 .then((response) => {
                     console.log('\n\nsubGroups response', response);
                     return resentful.reduceSingle(_.get(response, 'items'));
                 });
}

function loadPageGroupings() {
    return client.getEntries({ content_type: constants.contentTypes.pageGrouping })
                 .then((response) => {
                     console.log('\n\npageGroupings response', response);
                     return resentful.reduceSingle(_.get(response, 'items'));
                 });
}

function loadContentTypes() {
    return client.getContentTypes()
                 .then((response) => {
                     console.log('\n\ncontentTypes response', response);
                     return _.get(response, 'items');
                 });
}

function str(data) {
    return JSON.stringify(data, null, '    ');
}

module.exports = loadContent;
