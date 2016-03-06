# waterline-to-jsonapi
This library converts your [waterline](https://github.com/balderdashy/waterline) query results to valid [jsonapi](https://jsonapi.org) responses.

## API
```js
var waterline = new Waterline
// ...
var jsonapi = require('waterline-to-jsonapi')(waterline)
```

### jsonapi.single(model:Model, collection:String|Collection)
 * `model` A Model object, as returned e.g. by Collection#findOne()
 * `collection` Either the identity string of the collection, or the collection object as stored in `waterline.collections`

Turns a single model into a jsonapi reponse. If you have `populated` some association attributes, those will be added to the payload automatically under the `included` property.

### jsonapi.collection(list:Array<Model>, collection:String|Collection)
 * `list` A list of Model object, as returned e.g. by Collection#find()
 * `collection` Either the identity string of the collection, or the collection object as stored in `waterline.collections`

Turns a list of models into a jsonapi response. If you have `populated` some association attributes, those will be added to the payload automatically under the `included` property.

Also see `jsonapi.relation()`, which returns a payload adhering to the spec for relationship objects.

### jsonapi.relation(item:Model, baseCollection:String|Collection, attr:String)
 * `item` A Model object, as returned e.g. by Collection#findOne()
 * `baseCollection` Either the identity string of the collection, or the collection object as stored in `waterline.collections`
 * `attr` The attribute of the base model that represents the relation

Returns a jsonapi relationship response, optionally with the full resources `included` if you have populated the relation.

```js
var owner = await Owner.findOne({name: 'John'})
this.body = jsonapi.relation(owner, 'owner', 'pets')
```

### jsonapi.errors(er:Error|Array<Error>)
Turns your errors into a valid jsonapi response. You can either pass a single error or an array of errors.

## Legal
(c) 2016 by Marcel Klehr

MIT License
