jest.autoMockOff();

var flux = require.requireActual('flux');
var immutable = require.requireActual('immutable');

var Factory = require('../flux-factory');
var assign = require('object-assign');
var keyMirror = require('keymirror');

var allDataFields = {
  // 'data-field-key': 'action setter params list'
  profileName: ['name'],
  birthday: ['year', 'month', 'day'],
  gender: ['gender'],
  hometown: ['cityId', 'countryId'],
  relationship: ['status', 'relatedUserId']
};

var fluxEntityName = 'UserProfile';

function resetFactory() {
    Factory.destructor();
    Factory.init({
        flux: flux,
        immutable: immutable
    });
}

/**
 * factory
 */
describe('test factory core', function() {
    beforeEach(resetFactory);

    it('dependencies check', function() {
        Factory._deps = null;
        expect(function() {
            Factory.init({
                flux: {},
                immutable: {}
            });
        }).toThrow();
        expect(function() {
            var _allDataFields = assign({}, allDataFields);
            Factory.make(fluxEntityName, allDataFields);
        }).toThrow();
    });

    it('test make(config, entity)', function() {
        expect(Factory.useAction(fluxEntityName)).toBeUndefined();
        expect(Factory.useConstant(fluxEntityName)).toBeUndefined();
        expect(Factory.useDispatcher(fluxEntityName)).toBeUndefined();
        expect(Factory.useStore(fluxEntityName)).toBeUndefined();

        var _allDataFields = assign({}, allDataFields);

        Factory.make(fluxEntityName, allDataFields);

        expect(allDataFields).toEqual(_allDataFields);

        expect(Factory.useAction(fluxEntityName)).toBeTruthy();
        expect(Factory.useConstant(fluxEntityName)).toBeTruthy();
        expect(Factory.useDispatcher(fluxEntityName)).toBeTruthy();
        expect(Factory.useStore(fluxEntityName)).toBeTruthy();

        var dummyEntityName = fluxEntityName + '1';

        expect(Factory.useAction(dummyEntityName)).toBeUndefined();
        expect(Factory.useConstant(dummyEntityName)).toBeUndefined();
        expect(Factory.useDispatcher(dummyEntityName)).toBeUndefined();
        expect(Factory.useStore(dummyEntityName)).toBeUndefined();
    });

    it('make(config mapping)', function() {
        var dummyEntityName = fluxEntityName + '1';
        var specs = {};
        specs[dummyEntityName] = allDataFields;
        specs[fluxEntityName] = allDataFields;
        Factory.make(specs);
        var Constant = Factory.useConstant(fluxEntityName);
        var ConstantDummy = Factory.useConstant(dummyEntityName);
        expect(Constant).not.toBe(ConstantDummy);
        expect(Constant).toEqual(ConstantDummy);
    });

    it('test destructor()', function() {
        Factory.make(fluxEntityName, allDataFields);
        Factory.destructor();

        expect(Factory.useAction(fluxEntityName)).toBeUndefined();
        expect(Factory.useConstant(fluxEntityName)).toBeUndefined();
        expect(Factory.useDispatcher(fluxEntityName)).toBeUndefined();
        expect(Factory.useStore(fluxEntityName)).toBeUndefined();
    });
});

/**
 * makeConstant
 */
describe('test make constant', function() {
    beforeEach(resetFactory);

    it('assert constant keys', function() {
        Factory.make(fluxEntityName, allDataFields);
        var Constant = Factory.useConstant(fluxEntityName);

        expect(Constant.DataFields).toEqual(keyMirror({
            'PROFILE_NAME': null,
            'BIRTHDAY': null,
            'GENDER': null,
            'HOMETOWN': null,
            'RELATIONSHIP': null
        }));

        expect(Constant.ActionTypes).toEqual(keyMirror({
            'UPDATE_PROFILE_NAME': null,
            'UPDATE_BIRTHDAY': null,
            'UPDATE_GENDER': null,
            'UPDATE_HOMETOWN': null,
            'UPDATE_RELATIONSHIP': null
        }));
    });

    it('check cache reference', function() {
        Factory.make(fluxEntityName + '1', allDataFields);
        var Constant1 = Factory.useConstant(fluxEntityName + '1');
        Factory.make(fluxEntityName + '2', allDataFields);
        var Constant2 = Factory.useConstant(fluxEntityName + '2');

        expect(Constant1).toEqual(Constant2);
        expect(Constant1).not.toBe(Constant2);
    });
});

/**
 * makeAction
 */
describe('test make action', function() {
    beforeEach(resetFactory);

    it('assert action methods keys', function() {
        Factory.make(fluxEntityName, allDataFields);
        var Action = Factory.useAction(fluxEntityName);

        expect(Action.updateProfileName).toEqual(jasmine.any(Function));
        expect(Action.updateBirthday).toEqual(jasmine.any(Function));
        expect(Action.updateGender).toEqual(jasmine.any(Function));
        expect(Action.updateHometown).toEqual(jasmine.any(Function));
        expect(Action.updateRelationship).toEqual(jasmine.any(Function));
    });

    it('assert values passed to dispatcher', function() {
        Factory.make(fluxEntityName, allDataFields);
        var Action = Factory.useAction(fluxEntityName);
        var Dispatcher = Factory.useDispatcher(fluxEntityName);

        Dispatcher.handleViewAction = jest.genMockFunction();
        Action.updateBirthday('yy', 'mm', 'dd');
        var call = Dispatcher.handleViewAction.mock.calls[0];
        expect(call[0]).toEqual({
            type: 'UPDATE_BIRTHDAY',
            year: 'yy',
            month: 'mm',
            day: 'dd'
        });
        expect(call[1]).toBeUndefined();
    });
});

/**
 * makeDispatcher
 */
describe('test dispatcher', function() {
    beforeEach(resetFactory);

    it('assert values passed', function() {
        Factory.make(fluxEntityName, allDataFields);
        var Dispatcher = Factory.useDispatcher(fluxEntityName);

        Dispatcher.dispatch = jest.genMockFunction(); // flux dispatcher native method

        expect(Dispatcher.handleViewAction).toEqual(jasmine.any(Function));
        var memo = {
            year: 'yy',
            month: 'mm',
            day: 'dd'
        };
        Dispatcher.handleViewAction(memo);
        var call = Dispatcher.dispatch.mock.calls[0];
        expect(call[0]).toEqual({
            action: memo,
            source: 'VIEW_ACTION' // defined in makeDispatcher.PayloadSources
        });
        expect(call[1]).toBeUndefined();
    });
});

/**
 * pipeline
 */
describe('test pipeline', function() {
    beforeEach(resetFactory);

    it('pineline', function() {
        Factory.make(fluxEntityName, allDataFields);
        var Action = Factory.useAction(fluxEntityName);
        var Dispatcher = Factory.useDispatcher(fluxEntityName);
        var Store = Factory.useStore(fluxEntityName);

        expect(Store.updateBirthday).toEqual(jasmine.any(Function));

        Store.updateBirthday = jest.genMockFunction();
        Store.updateRelationship = jest.genMockFunction();
        Store.onDispatcherPayload = jest.genMockFunction();

        Action.updateBirthday('yy', 'mm', 'dd');

        var call = Store.updateBirthday.mock.calls.shift();
        expect(call[0]).toEqual({
            year: 'yy',
            month: 'mm',
            day: 'dd'
        });
        expect(call[1]).toBeUndefined();
        expect(Store.updateRelationship.mock.calls[0]).toBeUndefined();
        call = Store.onDispatcherPayload.mock.calls.shift();
        expect(call[0]).toEqual(jasmine.any(Object));
        expect(call[0].action).toEqual(jasmine.any(Object));

        // unregister dispatcher
        expect(Store.dispatchToken).toEqual(jasmine.any(String));
        Dispatcher.unregister(Store.dispatchToken);
        Action.updateBirthday('yy', 'mm', 'dd');
        expect(Store.updateBirthday.mock.calls.shift()).toBeUndefined();
    });

    it('store getter/setter', function() {
        Factory.make(fluxEntityName, allDataFields);
        var Action = Factory.useAction(fluxEntityName);
        var Dispatcher = Factory.useDispatcher(fluxEntityName);
        var Store = Factory.useStore(fluxEntityName);

        Store.emitChange = jest.genMockFunction();

        // setter emits change
        Action.updateBirthday('yy', 'mm', 'dd');
        var expectedData = {
            year: 'yy',
            month: 'mm',
            day: 'dd'
        };
        var call = Store.emitChange.mock.calls.shift();
        expect(call[0]).toEqual('birthday'); // field key
        expect(call[1]).toEqual(expectedData);
        expect(Store.getBirthday()).toEqual(expectedData);

        // set same data, should not emits change
        Action.updateBirthday('yy', 'mm', 'dd');
        call = Store.emitChange.mock.calls.shift();
        expect(call).toBeUndefined();
        expect(Store.getBirthday()).toEqual(expectedData);

        // set different data
        Action.updateBirthday('yy-1', 'mm-1', 'dd-1');
        expectedData = {
            year: 'yy-1',
            month: 'mm-1',
            day: 'dd-1'
        };
        call = Store.emitChange.mock.calls.shift();
        expect(call[0]).toEqual('birthday'); // field key
        expect(call[1]).toEqual(expectedData);
        expect(Store.getBirthday()).toEqual(expectedData);
    });
});