/**
 * @providesModule makeAction
 */
var invariant = require('invariant');

var makeConstant = require('./makeConstant');
var makeDispatcher = require('./makeDispatcher');
var utils = require('./utils');

var cache = {};

function makeSetterMethod(factory, dispatcher, actionType, payloadProps) {
    var Dispatcher = factory._deps.flux.Dispatcher;

    invariant(dispatcher instanceof Dispatcher, 'format check');
    invariant(actionType, 'format check');
    invariant(Array.isArray(payloadProps), 'format check');

    var payload = {type: actionType};

    return function(a, b, c, d, e, _) {
        invariant(_ === undefined, 'Too many arguments');
        var argLen = arguments.length;
        // invariant(argLen === payloadProps.length);
        for (var i = 0; i < argLen; i++) {
            payload[payloadProps[i]] = arguments[i];
        }

        dispatcher.handleViewAction(payload);
    };
}

function makeAction(factory, config, cacheId) {
    invariant(factory && config && cacheId, 'format check');

    if (cache[cacheId]) {
        return cache[cacheId];
    }

    var actionMethods = {};
    var constantAssociated = makeConstant(factory, config, cacheId);
    var dispatcherAssociated = makeDispatcher(factory, config, cacheId);

    Object.keys(config).forEach(function(_key) {
        var name = utils.getSetterMethodName(_key);
        var actionType = utils.getActionTypeKey(_key);
        // though it's key-mirrored, but by logic, we should use the
        // value instead of key
        actionType = constantAssociated.ActionTypes[actionType];

        var actionMethodParams = config[_key];
        actionMethods[name] = makeSetterMethod(factory, dispatcherAssociated, actionType, actionMethodParams);
    });

    cache[cacheId] = actionMethods;
    return cache[cacheId];
}

makeAction.getInstance = function(cacheId) {
    return cache[cacheId];
};
makeAction.destructor = function() {
    cache = {};
};

module.exports = makeAction;