/**
 * @providesModule makeStore
 */
var assign = require('object-assign');
var invariant = require('invariant');
var EventEmitter = require('events').EventEmitter;

var makeConstant = require('./makeConstant');
var makeDispatcher = require('./makeDispatcher');
var utils = require('./utils');

var CHANGE_EVENT = "change";

var cache = {};
var emptyFunc = function() {};

function makeStore(factory, config, cacheId) {
    invariant(factory && config && cacheId, 'format check');

    var Immutable = factory._deps.immutable;

    if (cache[cacheId]) {
        return cache[cacheId];
    }

    var Store = assign({}, EventEmitter.prototype, {
        emitChange: function(field, memo) {
            this.emit(CHANGE_EVENT, memo);
        },
        addChangeListener: function(listener) {
            this.on(CHANGE_EVENT, listener);
        },
        removeChangeListener: function(listener) {
            this.removeListener(CHANGE_EVENT, listener);
        }
    });

    var constantAssociated = makeConstant(factory, config, cacheId);
    var dispatcherAssociated = makeDispatcher(factory, config, cacheId);

    Store._dataFields = {};

    Object.keys(config).forEach(function(_key) {
        Store._dataFields[_key] = Immutable.fromJS({});
        var setterMethodName = utils.getSetterMethodName(_key);
        Store[setterMethodName] = setterFuncFactory(_key);
        var getterMethodName = utils.getGetterMethodName(_key);
        Store[getterMethodName] = getterFuncFactory(_key);
    });

    function getterFuncFactory(field) {
        return function() {
            return assign({}, Store._dataFields[field].toJSON());
        };
    }
    function setterFuncFactory(field) {
        return function(data) {
            var current = Store._dataFields[field];
            var next = current.mergeDeep(Immutable.fromJS(data, function (key, value) {
                var isIndexed = Immutable.Iterable.isIndexed(value);
                return isIndexed ? value.toList() : value.toOrderedMap();
            }));
            var isDirty = (next !== current);
            if (isDirty) {
                Store._dataFields[field] = next;
                Store.emitChange(field, data);
            }
        };
    }

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
    // give user a chance to touch inside this dispatcher handler
    Store.onDispatcherPayload = emptyFunc;
    onDispatcherPayload = utils.after(onDispatcherPayload, function(a, b, c) {
        Store.onDispatcherPayload(a, b, c);
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