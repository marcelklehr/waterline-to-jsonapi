
module.exports = function(waterline) {
  var jsonapi = {}

  jsonapi.error = function(error) {
    if(errors instanceof Error) {
      return {
	id: uuid.v4()
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
  jsonapi.single = function(item, collection) {
    var included = {}
    var data = {
      data: jsonapi.itemFull(item, collection, included)
    }
    if(Object.keys(included).length) {
      data.included = included
    }
    return data
  }

  jsonapi.item = function(item, collection) {
    return {
      type: collection.identity || collection
    , id: item.id || item
    }
  }

  jsonapi.itemFull = function(item, collection, included) {
    if(!collection.identity) collection = waterline.collections[collection]

    var data = jsonapi.item(item, collection)
    data.attributes = {}
    var relationships = {}
    for(var attr in collection.attributes) {
      // to-one
      if(collection.attributes[attr].model) {
	var relatedCollection = waterline.collections[collection.attributes[attr].model]
	relationships[attr] = jsonapi.relationOne(item, collection, attr, item[attr], relatedCollection, included)
      }else
      // to-many
      if(collection.attributes[attr].collection) {
	var relatedCollection = waterline.collections[collection.attributes[attr].collection]
	relationships[attr] = jsonapi.relationMany(item, collection, attr, item[attr], relatedCollection, included)
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
  jsonapi.addMeta = function((payload, meta) {
    if(!payload.meta) payload.meta = {}
    for(var prop in meta) {
      payload.meta[prop] = meta[prop]
    }
    return payload
  }

  /**
   * @public
   */
  jsonapi.relation = function(item, baseCollection, attr, related, relatedCollection, included) {
    if(!baseCollection.identity) baseCollection = waterline.collections[baseCollection]
    if(!relatedCollection.identity) relatedCollection = waterline.collections[relatedCollection]
    if(!included) included = {}
    if(baseCollection.attributes[attr].model) {
      return jsonapi.relationOne(item, baseCollection, attr, related, relatedCollection, included)
    }else if (baseCollection.attributes[attr].model) {
      return jsonapi.relationMany(item, baseCollection, attr, related, relatedCollection, included)
    }
  }

  jsonapi.relationOne = function(item, baseCollection, attribute, other, relatedCollection, included) {  
    var data = {
      data: jsonapi.item(other, relatedCollection)
    }
   
    // If the relation has been populated, the objects are available in .included
    if('object' === typeof item) {
      if(!included[relatedCollection.identity]) included[relatedCollection.identity] = {}
      included[relatedCollection.identity][other.id] = jsonapi.itemFull(other, relatedCollection)
    }
   
    if(baseCollection.attributes[attribute].jsonapi_linkSelf) {
      data.links = {
	self: baseCollection.attributes[attribute].jsonapi_linkSelf(item)
      }
    }
    return data
  }

  jsonapi.relationMany = function(item, baseCollection, attribute, list, relatedCollection, included) {
    var data = {
      data: item[attr].map((item) => {
	// .data only contains shallow objects
	var data = jsonapi.item(item, relatedCollection)
	// If the relation has been populated, the objects are available in .included
	if('object' === typeof item) {
	  if(!included[relatedCollection.identity]) included[relatedCollection.identity] = {}
	  included[relatedCollection.identity][item.id] = jsonapi.itemFull(item, relatedCollection)
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

  jsonapi.collection = function(list, collection, included) {
    if(!included) included = {}
    if(!collection.identity) collection = waterline.collections[collection]
    return {
      data: list.map((item)=>jsonapi.itemFull(item, collection, included))
    }
  }

  jsonapi.included = function(included) {
    var rendered = []
    for(var identity in included) {
      var collection = included[identity].__collection
      delete included[identity].__collection
      rendered = rendered.concat(
	Object.keys(included[identity])
	.map((id) => jsonapi.itemFull(included[identity][id], collection)
      )
    }
    return rendered
  }
  return jsonapi
}
