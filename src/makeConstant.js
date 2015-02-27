/**
 * @providesModule makeConstant
 */
var invariant = require('invariant');
var keyMirror = require('keymirror');
var utils = require('./utils');

var cache = {};

function makeConstant(config, cacheId) {
    if (cache[cacheId]) {
        return cache[cacheId];
    }

    var dataSources = {};
    var setterMethods = {};

    Object.keys(config).forEach(function(_key) {
        var key = normalize(_key);

        invariant(key.indexOf('_') === 0, 'Data source key can not start with \'_\'');
        invariant(key.indexOf('UPDATE') === 0, 'Data source key can not start with \'UPDATE\'');

        dataSources[utils.getStoreFieldKey(key)] = null;
        setterMethods[utils.getActionTypeKey(key)] = null;
    });

    cache[cacheId] = {
        DataFields: keyMirror(dataSources),
        ActionTypes: keyMirror(setterMethods)
    };
    return cache[cacheId];
}

makeConstant.getInstance = function(cacheId) {
    return cache[cacheId];
};
makeConstant.destructor = function() {
    cache = null;
};

module.exports = makeConstant;