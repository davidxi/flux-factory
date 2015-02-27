/**
 * @providesModule factory
 */
var assign = require('object-assign');
var invariant = require('invariant');

var makeAction = require('./makeAction');
var makeConstant = require('./makeConstant');
var makeDispatcher = require('./makeDispatcher');
var makeStore = require('./makeStore');

var factory = {
    /**
     * set up
     */
    make: function(namespace, config) {
        invariant(namespace, 'format check');
        if (typeof namespace === 'object') {
            Object.keys(namespace).forEach(function(ns) {
                factory.make(ns, namespace[ns]);
            });
            return;
        }
        invariant(config && (typeof config === 'object'), 'format check');

        ['makeAction', 'makeConstant', 'makeDispatcher', 'makeStore'].forEach(function(klass) {
            klass(config, namespace);
        });
    },
    /**
     * shortcut to exposed generated action/constant/dispatcher/store object
     */
    useAction: function(namespace) {
        return makeAction.getInstance(namespace);
    },
    useConstant: function(namespace) {
        return makeConstant.getInstance(namespace);
    },
    useDispatcher: function(namespace) {
        return makeDispatcher.getInstance(namespace);
    },
    useStore: function(namespace) {
        return makeStore.getInstance(namespace);
    },
    /**
     * tear down
     */
    destructor: function() {
        ['makeAction', 'makeConstant', 'makeDispatcher', 'makeStore'].forEach(function(klass) {
            klass.destructor();
        });
    }
};

module.exports = factory;