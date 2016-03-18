# waterline-to-jsonapi
This library converts your [waterline](https://github.com/balderdashy/waterline) query results to valid [jsonapi](https://jsonapi.org) responses.

## Examples
First up you need to initialize the library with your waterline instance:

```js
var jsonapi = require('waterline-to-jsonapi')(waterline)
```

### Returning a single resource
```js
// GET /owners/1/relationship/pets
var pet = await Pet.findOne(1).populate('owner')
this.body = jsonapi.single(pet, 'pet') // 'pet' is the identity of the model
/*

{ "data": {
    "type": "pet"
  , "id": "1"
  , "attributes": {
      "name": "foo"
    }
  , "relationships": {
      "owner": {"data": {"type": "owner", "id": "1"} }
    }
  }
, included: [
    {
      "type": "owner"
    , "id": "1"
    , "attributes": {
        "name": "John"
      }
    , "relationships": {
        "pets": {
          "data":[
            {"type":"pet", "id": "1"}
          ]
        }
      }
    }
  ]
}
*/
```

### Sparse fieldsets
```
var data = jsonapi.single(item, 'pet', {fields: {
  pet: 'name,owner'
}})
```

This works for `jsonapi.single()`, `jsonapi.collection()` and `jsonapi.relation()`.

Note: In order to obtain an object that complies to this format, you may want to use
 a querystring parser that supports nested data, like [qs](https://npmjs.com/package/qs).

### Adding links and meta info

You can always add links and meta data as follows:
```js
var pet = await Pet.findOne(1)
var data = jsonapi.single(pet, 'pet')

jsonapi.addLinks(data, {
  self: '/api/pets/1'
})

jsonapi.addMeta(data, {
  copyright: '(c) forever by Microsoft'
})

this.body = data
```

### Returning collections

```js
// Old pets
var oldPets = await Pet.find({age: {'>': 2}})
this.body = jsonapi.collection(oldPets, 'pet')
```

### Returning relationships
```js
// All of Walter's pets
var walter = await Owner.findOne({name: 'Walter'}).populate('pets')
this.body = jsonapi.relation(walter, 'owner', 'pets')
```

## API
```js
var waterline = new Waterline
// ...
var jsonapi = require('waterline-to-jsonapi')(waterline)
```

### jsonapi.single(model:Model, collection:String|Collection [, opts:Object])
 * `model` A Model object, as returned e.g. by Collection#findOne()
 * `collection` Either the identity string of the collection, or the collection object as stored in `waterline.collections`
 * `opts` See "options".

Turns a single model into a jsonapi reponse. If you have `populated` some association attributes, those will be added to the payload automatically under the `included` property.

### jsonapi.collection(list:Array&lt;Model&gt;, collection:String|Collection [, opts:Object])
 * `list` A list of Model object, as returned e.g. by Collection#find()
 * `collection` Either the identity string of the collection, or the collection object as stored in `waterline.collections`
 * `opts` See "options".

Turns a list of models into a jsonapi response. If you have `populated` some association attributes, those will be added to the payload automatically under the `included` property.

Also see `jsonapi.relation()`, which returns a payload adhering to the spec for relationship objects.

### jsonapi.relation(item:Model, baseCollection:String|Collection, attr:String [, opts:Object])
 * `item` A Model object, as returned e.g. by Collection#findOne()
 * `baseCollection` Either the identity string of the collection, or the collection object as stored in `waterline.collections`
 * `attr` The attribute of the base model that represents the relation
 * `opts` See "options".

Returns a jsonapi relationship response, optionally with the full resources `included` if you have populated the relation.

```js
var owner = await Owner.findOne({name: 'John'})
this.body = jsonapi.relation(owner, 'owner', 'pets')
```

### options:Object
 * `fields` Sparse fieldset constraints (optional). Must be an object with collection identities as keys and string lists of attributes as values: `{pets: 'name,age,owner', owner: 'name,pets'}`

### jsonapi.errors(er:Error|Array&lt;Error&gt;)
Turns your errors into a valid jsonapi response. You can either pass a single error or an array of errors.

### jsonapi.addLinks(payload:Object, links:Object)
Add links to your jsonapi response.

### jsonapi.addMeta(payload:Object, meta.Object)
Add meta info to your jsonapi response.

## Legal
(c) 2016 by Marcel Klehr

MIT License
