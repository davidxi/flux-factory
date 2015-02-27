/**
 * @providesModule makeDispatcher
 */
var assign = require('object-assign');
var keyMirror = require('keymirror');
var Dispatcher = require('flux').Dispatcher;

var cache = {};

function curryPayloadSource(source) {
    return function(action) {
        this.dispatch({
            source: source,
            action: action
        });
    };
}

function makeDispatcher(config, cacheId) {
    if (cache[cacheId]) {
        return cache[cacheId];
    }
    cache[cacheId] = assign(new Dispatcher(), {
        handleServerAction: curryPayloadSource(makeDispatcher.PayloadSources.SERVER_ACTION),
        handleViewAction: curryPayloadSource(makeDispatcher.PayloadSources.VIEW_ACTION)
    });
    return cache[cacheId];
}

makeDispatcher.PayloadSources = keyMirror({
    VIEW_ACTION: null,
    SERVER_ACTION: null
});

makeDispatcher.getInstance = function(cacheId) {
    return cache[cacheId];
};
makeDispatcher.destructor = function() {
    cache = null;
};

module.exports = makeDispatcher;