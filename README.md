[![npm](https://img.shields.io/badge/npm-0.0.2-blue.svg)]()

# flux-factory

A Flux pattern wrapper to let you write <b>less</b> Flux structure code.

## Why less code

Let's revisit the [Flux structure](https://github.com/facebook/flux)

![Flux Architecture](https://github.com/facebook/flux/raw/master/docs/img/flux-diagram-white-background.png)

Now, imagine you have a form page where all form inputs are implemented in react. So each form field has:

> 1. a variable in the store module to cache its value;
> 2. a seperate if logic in the dispatcher callback to invoke some setter method to update its value
> 3. a dispatcher instance
> 4. a setter method in action module to call the dispatcher
> 5. some constant variables defined in constant module to be used in both actions and store

This is not a big deal for a simple Todo app. However, as we add more and more data fields in the store, we have to add all 5 places as stated above (and mostly they are kinda duplicated code compared to existing code).

Also, this patter introduces some code coupling. For example, if we want modify a constant declare in the constant module, i have to modify other palces in both actions and store.

So, is it possible that when we add or redeine a data field, we can utilize some sort of factory function, such that we only need to modify one place (ie, constant module), and all the other places would be automatically added and updated (ie, action, dispatcher, store modules)?

With `flux-factory`, the answer is yes. Now, let's look at the following example.

## Usage


```js
var fluxFactory = require('flux-factory');

var allDataFields = {
  // 'data-field-key': 'action setter params list'
  profileName: ['name'],
  birthday: ['year', 'month', 'day'],
  gender: ['gender'],
  hometown: ['cityId', 'countryId'],
  relationship: ['status', 'relatedUserId']
};

var fluxEntityName = 'UserProfile';

fluxFactory(fluxEntityName, allDataFields);
```

Now, what did `flux-factory` do in the underhood?

<b>(1) First</b>, it automatically creates a constant object as formatted below:

```js
/* constant object auto generated */
constant = {
  DataFields: {
    PROFILE_NAME: ..
    BIRTHDAY: ..
    GENDER: ..
    ...
  },
  ActionTypes: {
    UPDATE_PROFILE_NAME: ..
    UPDATE_BIRTHDAY: ..
    UPDATE_GENDER: ..
    ...
  }
}
```

<b>(2) Then</b>, it automatically creates a dispatcher object, whose methods looks exactly like flux examples sample code.
> By concept, since the dispatcher is used as a bridge between action module and store module, in most cases, you don't need to modify/extend this generated object.

<b>(3) Then</b>, it automatically creates a store object, which inherits from `EventEmitter` obejct (same as in flux sample code). Event subscribe/unsubscribe functions are also bound. Also, it has following properties created:

```js
/* store object auto generated */
store = assign(new EventEmitter, {

	updateProfileName: {name} => noop,
	updateBirthday: {year, month, day} => noop,
	updateGender: {gender} => noop,
	....

	dispatchToken = payload => {
	  if (payload.action.type ===
	  	  constant.actionType.UPDATE_PROFILE_NAME) {
	  	  store.updateProfileName(payload.data)
	  }
	  if (payload.action.type ===
	  	  constant.actionType.UPDATE_BIRTHDAY) {
	  	  store.updateBirthday(payload.data)
	  }
	  ...
	}
})

```
So you can extend this generated store object by yourself, to implement those data field values setter functions. (They were created to be empty function initially).

<b>(4) Lastly</b>, it automatically creates an action object, which has all the setter function which leads to invoke correspoding store setter function through the dispatcher module.

```js
/* action object auto generated */
action = {
  updateProfileName: function(name),
  updateBirthday: fucntion(year, month, day),
  updateGender: function(gender),
  ....
}
```

`flux-factory` already sets up correct `ActionType` and arguments list in each setter function, therefore each setter function should go to correct store setter function; and the data property name should be the same as you defined in the config object when you call `make(config, namespace)` in the beginning. So, in most cases, you don't need modify this generated action object.

###SO,
All in all, once you defined the config mapping between data field name and its setter function arguments list variable names; all you need to do, is to implement store setter functions for each data field. (note that there is no need to modify generated action setter functions). And all the logic between actions and store is already implemented.

And how to extend those generated action/constant/dispatcher/store object?

```js

fluxFactory('UserProfile', {config mapping})

var action = fluxFactory.useAction('UserProfile');
var constant = fluxFactory.useConstant('UserProfile');
var dispatcher = fluxFactory.useDispatcher('UserProfile');
var store = fluxFactory.useStore('UserProfile');
```

And of course, you can also pass in a batched config mapping to created action/constant/dispatcher/store for multiple entities:

```js
fluxFactory({
  UserProfile: {mapping ...},
  Notifications: {mapping ...}
});

var userStore = fluxFactory.useStore('UserProfile');
var notificationStore = fluxFactory.useStore('Notifications');
```