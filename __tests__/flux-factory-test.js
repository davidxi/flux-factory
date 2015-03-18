jest.dontMock('../flux-factory');
jest.dontMock('object-assign');
jest.dontMock('keymirror');

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

/**
 * factory
 */
describe('test factory core', function() {
    beforeEach(function() {
        Factory.destructor();
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
    beforeEach(function() {
        Factory.destructor();
    });

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
    beforeEach(function() {
        Factory.destructor();
    });

    it('assert action methods keys', function() {
        Factory.make(fluxEntityName, allDataFields);
        var Action = Factory.useAction(fluxEntityName);

        expect(typeof Action.updateProfileName).toBe('function');
        expect(typeof Action.updateBirthday).toBe('function');
        expect(typeof Action.updateGender).toBe('function');
        expect(typeof Action.updateHometown).toBe('function');
        expect(typeof Action.updateRelationship).toBe('function');
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
    beforeEach(function() {
        Factory.destructor();
    });

    it('assert values passed', function() {
        Factory.make(fluxEntityName, allDataFields);
        var Dispatcher = Factory.useDispatcher(fluxEntityName);

        Dispatcher.dispatch = jest.genMockFunction(); // flux dispatcher native method

        expect(typeof Dispatcher.handleViewAction).toBe('function');
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
    beforeEach(function() {
        Factory.destructor();
    });

    it('pineline', function() {
        Factory.make(fluxEntityName, allDataFields);
        var Action = Factory.useAction(fluxEntityName);
        var Dispatcher = Factory.useDispatcher(fluxEntityName);
        var Store = Factory.useStore(fluxEntityName);

        expect(typeof Store.updateBirthday).toBe('function');

        Store.updateBirthday = jest.genMockFunction();
        Store.updateRelationship = jest.genMockFunction();

        Action.updateBirthday('yy', 'mm', 'dd');

        var call = Store.updateBirthday.mock.calls[0];
        expect(call[0]).toEqual({
            year: 'yy',
            month: 'mm',
            day: 'dd'
        });
        expect(call[1]).toBeUndefined();
        expect(Store.updateRelationship.mock.calls[0]).toBeUndefined();
    });
});