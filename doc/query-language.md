# Query Language

The purpose of the query language is to make it possible for a web service to extract complex data structures from a Community service [database](db-model.md).  The database has three main "objects", namely `Profile`, `Entity`, and `Action`.

(There is a fourth "object" `Community` which is used internally to use the same database for several communities at the same time, a feature that will not be discussed here.)

A query is a [JSON](http://json.org) structure where each *name* is either an operator or a literal key that will appear in the result of the query.  The structure of the result should thus be apparent from the structure of the query.

In a query, each name has a *value* which determines what data will be extracted from the database being queried.

In this document we write the queries directly as JavaScript objects as they would appear in actual community code, instead of the more verbose serialised JSON version.

## Operators

Operators are written with capital initial letter to make them stand out from names that will be part of the result.

There are three kinds of operators: *selectors*, *limitors*, and *extractors*.

### `Singleton`

Request a single database object that meets some criteria.

Format: `{Singleton: ` *criteria*`,` *extractor* `}`

Example:

```js
{ Singleton: { Profile: { id: 552 } }
, Include: "attribute.name"
}
```
Result:
```json
"D. Duck"
```

The result is a single object that matches the query.  If there are no or several matches, an error is returned.


### `List`

Requests a list of database objects that macth some criteria.

Format: `{List:` *criteria* `,` *limitor* `,` *limitor* `,` ... `,` *extractor* `}`

Example:

```js
{ List: { Entity: { type: "post" } }
, SortBy: "createdDate"
, Order: "descending"
, Limit: 2
, Offset: 0
, Include: "attribute.text"
}
```
Result:
```json
{ "Total": 125
, "NextOffset": 2
, "List":
  [ "Once upon a time..."
  , "In the beginning there was only a man from..."
  ]
}
```


### `Count`

Counts the number of database objects that meet some critria.

Format:

`{Count: ` *criteria* `}`

Example:

```js
{ Count: { Action: { type: "like", entityId: 3217 } } }
```
Result:
```json
5
```


### `Include`

Example:

```js
{ Singleton: { Profile: { id: 552 } }
, Include: "attribute.name"
}
```
Result:
```json
"D. Duck"
```

Example:

```js
{ Singleton: { Profile: { id: 552 } }
, Include: { id: "id", name: "attribute.name" }
}
```
Result:
```json
{ "id": 552, "name": "D. Duck" }
```


### `Context`

Extracts database objects by following their linkage to other objects.  The result is the set of objects from the object in current context to the end of the linkage chain.  Each object in the result is embedded into the next object in the chain, so effectively the chain is reversed, the first object being the inner-most embedded object.

Example:

```js
{ Singleton: { Entity: { id: 15532 } }
, Context: "parentId"
, Include: { id: "id", text: "attribute.text" }
}
```
Result:
```json
{ "id": 432
, "text": "A group for Minecrafting"
, "Embed":
  { "id": 11374
  , "text": "I love the new version!"
  , "Embed":
    { "id": 15532
    , "text": "So do I"
    }
  }
}
```

### `Case`

Similar to Include, but can separate database objects into types based on the objects' fields.

Example:

```js
{ Singleton: { Entity: { id: 15532 } }
, Context: "parentId"
, Case:
  [ { type: "group"
    , Include: "attribute.name"
    }
  , { type: "post"
    , Include: "attribute.text"
    }
  , { type: "comment"
    , Include: { id: "id", answer: "attribute.comment" }
    }
  ]
}
```
Result:
```json
{ "group": "Minecraft"
, "Embed":
  { "post": "I love the new version!"
  , "Embed":
    { "comment":
      { "id": 15532
      , "answer": "So do I"
      }
    }
  }
}
```

## Scoping

{How to refer from inner queries to result of outer queries, like `posts.id` inside a comment. }

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
