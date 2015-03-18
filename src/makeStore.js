/**
 * @providesModule makeStore
 */
var assign = require('object-assign');
var EventEmitter = require('events').EventEmitter;

var makeConstant = require('./makeConstant');
var makeDispatcher = require('./makeDispatcher');
var utils = require('./utils');

var CHANGE_EVENT = "change";

var cache = {};
var emptyFunc = function() {};

function makeStore(config, cacheId) {
    if (cache[cacheId]) {
        return cache[cacheId];
    }

    var Store = assign({}, EventEmitter.prototype, {
        emitChange: function() {
            this.emit(CHANGE_EVENT);
        },
        addChangeListener: function(listener) {
            this.on(CHANGE_EVENT, listener);
        },
        removeChangeListener: function(listener) {
            this.removeListener(CHANGE_EVENT, listener);
        }
    });

    var constantAssociated = makeConstant(config, cacheId);
    var dispatcherAssociated = makeDispatcher(config, cacheId);

    Object.keys(config).forEach(function(_key) {
        var setterMethodName = utils.getSetterMethodName(_key);
        Store[setterMethodName] = emptyFunc;
    });

    var onDispatcherPayload = function(payload) {
        return payload.action;
    };
    Object.keys(config).forEach(function(_key) {
        var setterMethodName = utils.getSetterMethodName(_key);
        var actionType = utils.getActionTypeKey(_key);
        // though it's key-mirrored, but by logic, we should use the
        // value instead of key
        actionType = constantAssociated.ActionTypes[actionType];
        // tail recursion
        onDispatcherPayload = utils.after(onDispatcherPayload, function(expectedType, payload) {
            var action = payload.action;
            if (action.type === expectedType) {
                var actionCloned = assign({}, action);
                delete(actionCloned.type);
                Store[setterMethodName](actionCloned);
            }
            return payload.action;
        }.bind(Store, actionType));
    });
    Store.dispatchToken = dispatcherAssociated.register(onDispatcherPayload);

    utils.bindAll(Store);

    cache[cacheId] = Store;
    return cache[cacheId];
}

makeStore.getInstance = function(cacheId) {
    return cache[cacheId];
};
makeStore.destructor = function() {
    cache = {};
};

module.exports = makeStore;