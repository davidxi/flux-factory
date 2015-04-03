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
    init: function(requires) {
        invariant(!factory._deps, 'Only invoke once');

        invariant(typeof requires === 'object', 'type check');
        var str = 'Please refer to the \'package.json\' file in this git repo for the recommended version of the dependency library.';
        var module = requires.flux;
        invariant(module &&
            module.Dispatcher,
            'Require \'flux\' library. ' + str);

        // immutable.js is too big, so if the user intends to not to use immutable,
        // we just set Store.setter/getter functions to be empty func
        invariant('immutable' in requires, 'If you do not intend to require \'immutable\', please still set { immutable: null }');
        // this invariant is to make the user aware of their choice of whether to
        // include immutable.js

        factory._deps = assign({}, requires);
    },
    isImmutableLibIncluded: function() {
        if (!factory._deps) return false;
        var module = factory._deps.immutable;
        return module &&
                module.fromJS &&
                module.Iterable;
    },
    /**
     * set up
     */
    make: function(namespace, config) {
        invariant(factory._deps, 'Require to include dependencies firstly');
        invariant(namespace, 'format check');
        if (typeof namespace === 'object') {
            Object.keys(namespace).forEach(function(ns) {
                factory.make(ns, namespace[ns]);
            });
            return;
        }
        invariant(typeof namespace === 'string', 'format check');
        invariant(config && (typeof config === 'object'), 'format check');

        [makeAction, makeConstant, makeDispatcher, makeStore].forEach(function(klass) {
            klass(factory, config, namespace);
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
        factory._deps = null;
        [makeAction, makeConstant, makeDispatcher, makeStore].forEach(function(klass) {
            klass.destructor();
        });
    }
};

module.exports = factory;