# JSON schemas

The schemas here govern the output of the web service.  These schemas are only used by the database testing.

In summary, the community service returns either a `data` or an `errors` value:

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

These schemas are inspired by [JSON-API](http://jsonapi.org/).