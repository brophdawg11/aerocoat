const contentful = require('contentful'),
    Resentful = require('resentful'),
    constants = require('./constants'),
    resentful = new Resentful(),
    client = createClient(),
    _ = require('lodash'),
    loadContent = {
        loadAllExistingData,
        loadSubGroups,
        loadContentTypes,
        loadPageGroupings,
    };

resentful.registerMappers(
    constants.contentTypes.subGroup,
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
    ];
    return Promise.all(promises)
                  .then((results) => {
                      return {
                          contentTypes: results[0],
                          subGroups: results[1],
                          pageGroupings: results[2],
                      };
                  })
                  .then((data) => {
                      console.log('Loaded existing data', str(data));
                      return data;
                  });
}

function loadSubGroups() {
    return client.getEntries({ content_type: constants.contentTypes.subGroup })
                 .then((response) => {
                     console.log('subGroups response', response);
                     return resentful.reduceSingle(_.get(response, 'items'));
                 });
}

function loadPageGroupings() {
    return client.getEntries({ content_type: constants.contentTypes.pageGrouping })
                 .then((response) => {
                     console.log('pageGroupings response', str(response.items));
                     return resentful.reduceSingle(_.get(response, 'items'));
                 });
}

function loadContentTypes() {
    return client.getContentTypes()
                 .then((response) => {
                     console.log('contentTypes response', response);
                     return _.get(response, 'items');
                 });
}

function str(data) {
    return JSON.stringify(data, null, '    ');
}

module.exports = loadContent;
