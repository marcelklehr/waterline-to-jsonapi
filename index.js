var uuid
module.exports = function(waterline) {
  var jsonapi = {}

  jsonapi.error = function(error) {
    if(error instanceof Error) {
      return {
	id: uuid? uuid.v4() : undefined
      , detail: error.message
      }
    }
  }

  jsonapi.errors = function(errors) {
    if(!Array.isArray(errors)) errors = [errors]
    return {
      errors: errors.map(jsonapi.error)
    }
  }
  /**
   * @public
   */
  jsonapi.single = function(item, collection, options) {
    var included = {}
    options = prepareOptions(options)
    var data = {
      data: jsonapi.itemFull(item, collection, included, options)
    }
    if(Object.keys(included).length) {
      data.included = jsonapi.included(included)
    }
    return data
  }

  jsonapi.item = function(item, collection) {
    return {
      type: collection.identity || collection
    , id: String(item.id || item)
    }
  }

  jsonapi.itemFull = function(item, collection, included, options) {
    if(!collection.identity) collection = waterline.collections[collection]

    var data = jsonapi.item(item, collection)
    data.attributes = {}
    var relationships = {}
    for(var attr in collection.attributes) {
      // Filter fields
      if(options.fields && options.fields[collection.identity]
         && !~options.fields[collection.identity].indexOf(attr)) {
        continue
      }
      // to-one
      if(collection.attributes[attr].model) {
	var relatedCollection = waterline.collections[collection.attributes[attr].model]
	relationships[attr] = item[attr]?
           jsonapi.relationOne(item, collection, attr, item[attr], relatedCollection, included, options)
         : null
      }else
      // to-many
      if(collection.attributes[attr].collection) {
        if(!item[attr].length) continue
	var relatedCollection = waterline.collections[collection.attributes[attr].collection]
	relationships[attr] = jsonapi.relationMany(item, collection, attr, item[attr], relatedCollection, included, options)
      }else
      // normal attribute
      {
	data.attributes[attr] = item[attr]
      }
    }
    if(Object.keys(relationships).length) {
      data.relationships = relationships
    }
    if(collection.jsonapi_selfLink) {
      data.links = {
	self: collection.jsonapi_linkSelf(item)
      }
    }

    // id must be string + not part of attrs
    delete data.attributes.id
    data.id = String(data.id)

    return data
  }

  /**
   * @public
   */
  jsonapi.addLinks = function(payload, links) {
    if(!payload.links) payload.links = {}
    for(var link in links) {
      payload.links[link] = links[link]
    }
    return payload
  }

  /**
   * @public
   */
  jsonapi.addMeta = function(payload, meta) {
    if(!payload.meta) payload.meta = {}
    for(var prop in meta) {
      payload.meta[prop] = meta[prop]
    }
    return payload
  }

  /**
   * @public
   */
  jsonapi.relation = function(item, baseCollection, attr, options) {
    if(!baseCollection.identity) baseCollection = waterline.collections[baseCollection]
    options = prepareOptions(options)
    var included = {}
    var related = item[attr]
    var relatedCollection = waterline.collections[baseCollection.attributes[attr].model || baseCollection.attributes[attr].collection]
    var data
    if(baseCollection.attributes[attr].model) {
      data = jsonapi.relationOne(item, baseCollection, attr, related, relatedCollection, included, options)
    }else if (baseCollection.attributes[attr].collection) {
      data = jsonapi.relationMany(item, baseCollection, attr, related, relatedCollection, included, options)
    }
    if(Object.keys(included).length) {
      data.included = jsonapi.included(included)
    }
    return data
  }

  jsonapi.relationOne = function(item, baseCollection, attribute, other, relatedCollection, included, options) {  
    var data = {
      data: jsonapi.item(other, relatedCollection)
    }
   
    // If the relation has been populated, the objects are available in .included
    if('object' === typeof item[attribute]) {
      if(!included[relatedCollection.identity]) included[relatedCollection.identity] = {}
      included[relatedCollection.identity][other.id] = jsonapi.itemFull(other, relatedCollection, included, options)
    }
   
    if(baseCollection.attributes[attribute].jsonapi_linkSelf) {
      data.links = {
	self: baseCollection.attributes[attribute].jsonapi_linkSelf(item)
      }
    }
    return data
  }

  jsonapi.relationMany = function(item, baseCollection, attribute, list, relatedCollection, included, options) {
    var data = {
      data: item[attribute].map((item) => {
	// .data only contains shallow objects
	var data = jsonapi.item(item, relatedCollection)
	// If the relation has been populated, the objects are available in .included
	if('object' === typeof item) {
	  if(!included[relatedCollection.identity]) included[relatedCollection.identity] = {}
	  included[relatedCollection.identity][item.id] = jsonapi.itemFull(item, relatedCollection, included, options)
	}
	return data
      })
    }
    if(baseCollection.attributes[attribute].jsonapi_linkSelf) {
      data.links = {
	self: baseCollection.attributes[attribute].jsonapi_linkSelf(item)
      }
    }
    return data
  }

  jsonapi.collection = function(list, collection, options) {
    options = prepareOptions(options)
    var included = {}
    if(!collection.identity) collection = waterline.collections[collection]
    var data = {
      data: list.map((item)=>jsonapi.itemFull(item, collection, included, options))
    }
    if(Object.keys(included).length) {
      data.included = jsonapi.included(included)
    }
    return data
  }

  jsonapi.included = function(included) {
    var rendered = []
    for(var identity in included) {
      var collection = waterline.collections[identity]
      rendered = rendered.concat(
	Object.keys(included[identity])
	.map((id) => included[identity][id])
      )
    }
    return rendered
  }

  function prepareOptions(options) {
    options = options || {}
    if(options.fields) {
      for(var collection in options.fields) {
	options.fields[collection] = options.fields[collection].split(',')
      }
    }
    return options
  }

  return jsonapi
}
