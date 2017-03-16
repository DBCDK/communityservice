# Query Language

The purpose of the query language is to make it possible for a web service to extract complex data structures from a Community service [database](db-model.md).  The database has three main "objects", namely `Profile`, `Entity`, and `Action`.

(There is a fourth "object" `Community` which is used internally to use the same database for several communities at the same time, a feature that will not be discussed here.)

A query is a [JSON](http://json.org) structure where each property is either an operator or a literal property that will appear in the result of the query.  The structure of the result should thus be apparent from the structure of the query.

In a query, each property has a *value* which determines what data will be extracted from the database being queried.

In this document we write the queries directly as JavaScript objects as they would appear in actual community code, instead of the more verbose serialised JSON version.

## Operators

Operators are written with capital initial letter to make them stand out from properties that will be part of the result.

There are three kinds of operators: *selectors*, *limitors*, and *extractors*.  They will be explained in the following sections with cross reference to each other.

### Selectors

They selectors correspond to the basic objects in the database.  They come in three versions, one for selecting a single object, and one for selecting a list of objects, and one for counting objects.

Thus, the following selectors exist: `Profile`, `Profiles`, `CountProfiles`, `Entity`, `Entities`, `CountEntities`, `Action`, `Actions`, `CountActions`.

Format: `{`*selector* `: {`*criteria*`},` ... `}`

#### Single object selectors

Request a single database object that meets some criteria.

Format: `{`*selector* `: {`*criteria*`},` *extractor* `}`

Example query:

```js
{ Profile: { id: 552 }
, Include: 'attribute.name'
}
```
Result:
```json
"D. Duck"
```

The result is a single object that matches the query.  If there are no or several matches, an error is returned.

#### Count of objects selector

Request the count of  database objects that macth some criteria.

Format: `{`*selector* `: {`*criteria*`} }`

Example query:

```js
{ CountActions: { type: 'like', entity_ref: 3217 } }
```

Result:

```json
5
```


#### List of objects selector

Requests a list of database objects that macth some criteria.

Format: `{`*selector* `: {`*criteria*`},` *limitor* `,` *limitor* `,` ... `,` *extractor* `}`

Example query:

```js
{ Entities: { type: 'post' }
, SortBy: 'created_epoch'
, Order: 'descending'
, Limit: 2
, Offset: 0
, Include: 'attribute.text'
}
```
Result query:
```json
{ "Total": 125
, "NextOffset": 3
, "List":
  [ "Once upon a time..."
  , "In the beginning there was only a man from..."
  ]
}
```

### Limitors

Limitors are used to limit and sort the reusult of list selectors.

The `Limit` operator limits the length of results list, and it must be present in any list selection.

The `Offset` operator can be used to continue from the point where a previous query was cut off be a `Limit`.  Defaults to 0.

The `SortBy` and `Order` operator can be used to prescribe how the selection is ordered before limiting is effectuated.  `SortBy` takes a string that refers to a property in the selected objects, default to `modified_epoch`.  `Order` can be `ascending` or `descending` (default).

### Extractors

The `Include` extractor builds up data to be returned from the query.  It can be encapsulated in one of two other extractors, namely `IncludeSwitch`, and `IncludeEntitiesRecursively`.

#### `Include` extractor

Consider the database object
```json
{ "id": "552"
, "attributes": { "name": "D. Duck" }
}
```

An `Include` extractor with a simple string argument will result in the value of the property (key) referred to by the string, using dot-notation for navigation into subobjects.

Example query:

```js
{ Profile: { id: 552 }
, Include: 'attributes.name'
}
```
Result:
```json
"D. Duck"
```

An `Include` extractor with an object argument will result in a new object with the properties defined in the argument.

Example query:

```js
{ Profile: { id: 552 }
, Include: { number: 'id', who: 'attributes.name' }
}
```
Result:
```json
{ "number": 552, "who": "D. Duck" }
```

The right-hand sides of the extractor object can be *subqueries*, in addition to simple strings above.  For example, consider a community administrator who wants to search for reviews that need approval:

Example query:

```js
{ Entities: { type: 'review', 'attributes.approvedBy': null }
, Limit: 10
, Include:
  { id: 'id'
  , review: 'contents'
  , image: 'attributes.picture'
  , profile:
    { Profile: { id: '^owner_id' }
    , Include: { id: 'id', who: 'attributes.name' }
    }
  }
}
```

The subquery refers to the `owner_id` of the objects found by the main query:


```js
{ Profile: { id: '^owner_id' }
, Include: { id: 'id', who: 'attributes.name' }
}
```

See the section on scoping for a detailed explanation

#### `IncludeSwitch` extractor

The `IncludeSwitch` extractor is used when the selected objects are of mixed types, based on the `type` property of the objects.

Consider the following example database structure for an Action:

```json
{ "id": 1234
, "owner_id": 3521
, "type": "like"
, "profile_ref": null
, "entity_ref": 452
}
```

Example query:

```js
{ Actions: { owner_id: 3521 }
, Limit: 5
, IncludeSwitch:
  { like: 'entity_ref'
  , follow: 'profile_ref'
  }
}
```

Result:

```json
{ "Total": 12
, "NextOffset": 6
, "List":
  [ { "like": 452 }
  , { "like": 14559 }
  , { "follow": 83753 }
  , { "follow": 75352 }
  , { "like": 4287 }
  ]
}
```

The right-hand sides of type switches are treated like `Include`s, so they can also be objects, possibly with subqueries.

#### `IncludeEntitiesRecursively` extractor

The `IncludeEntitiesRecursively` extractor follows the `entity_ref` property chain in objects in the database.  The result is an object that recursively embeds all the entities from the chain.

The chain starts from the object found by the selector, and continues until it reaches an entity that has a null `entity_ref`.  Each object in the result is embedded into the next object in the chain, so effectively the chain is reversed, the first object ending up as the inner-most embedded object.

Example query:

```js
{ Action: { id: 836635 }
, IncludeEntitiesRecursively:
  { comment: { id: 'id', text: 'contents' }
  , post: { id: 'id', text: 'contents' }
  , group: { name: title }
  }
}
```
Result:
```json
{ "group":
  { "name": "A group for Minecrafting"
  , "post":
    { "id": 11374
    , "text": "I love the new version!"
    , "comment":
      { "id": 15532
      , "text": "So do I"
      }
    }
  }
}
```

## Criteria

Properties of the Criteria object are *and*ed together.  Empty critiria object means no criteria.  `x: y` generally means property `x` must have the value `y`.  If `y` starts with a carret `^` it is a reference, see the Scoping section.

If `y` is an object is must be of the form `{ operator: `*operator*`, unit: `*unit*`, value: `*value*`}`.  Currently supported *operator*s are `newerThan` and `olderThan`, supported *unit* is `daysAgo`, and *value* must be a number.

## Scoping

When an extrator refers to a property as in
```js
{ Include: "attributes.approved" }
```
the object in the inner-most context must have a property `attributes` which in turn must have a property `approved`.

If the reference is prefixed with a carret `^`, the next-to-inner context is used, like in `^owner_id`.

{ In IncludeEntitiesRecursively the next-to-inner context is not counting the next-in-chain of entities, only the entity itself or the entity that started the chain.  See front-page example. }

## Errors

Inspired by [JSON-API](http://jsonapi.org/), the community service returns either a `data` or an `error` value:

Satisfied query:
```json
{ "data": "..."
, "meta": { "ms": 32, "sql-queries": 3 }
}
```

Failed query:
```json
{ "errors":
  { "status": "400"
  , "title": "Unknown object type"
  , "detail": "Object 'Entities' does not exist"
  , "source": { "pointer": "/List/Entities" }
  }
, "meta": "..."
}
```

{Do errors in sub-queries result in the whole query giving an error?}
