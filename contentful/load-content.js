'user strict'
var contentful = require('contentful'),
    Resentful = require('resentful'),
    constants = require('./constants'),
    resentful = new Resentful(),
    client = createClient(),
    _ = require('lodash');

resentful.registerMappers(
    constants.contentTypes.subGroup,
    entry => _.set(entry, 'fields._sys.id', _.get(entry, 'sys.id')));

function createClient() {
    return contentful.createClient({
        space: constants.spaceId,
        accessToken: constants.accessToken
    });
}

function loadSubGroups() {
    return client.getEntries({ content_type: constants.contentTypes.subGroup })
                 .then(response => {
                     return resentful.reduceSingle(_.get(response, 'items'));
                 });
}

module.exports = {
    loadSubGroups: loadSubGroups
};

