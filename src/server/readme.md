# Web Service

The web server accepts HTTP request bodies in JSON, which has to adhere to a [certain schemas](schemas/readme.md).

The service answers in [JSONAPI](http://jsonapi.org) format, which basically means that responses are either of the form
```json
{
  "data": ...,
}
```
or
```json
{
  "errors": [
    {
      "status": ...,
      "title": ...,
      ...
    }
  ]
}
```

# Error handling

The [`index.js`](index.js) handles all unknown endpoints, malformed JSON input, and thrown server errors.  Server errors are logged according to the [environment settings](../../README.md).

# Routes

The API version is part of the URL.  So all version 1 routes start with `/v1`, and all files pertaining to version 1 routes have `-v1` in their name.
