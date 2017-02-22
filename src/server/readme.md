# Web Service

The web server accepts HTTP request bodies [in JSON only](schemas/readme.md), and the service returns answers in [JSONAPI](http://jsonapi.org) format.

# Error handling

The [`index.js`](index.js) handles all unknown endpoints, malformed JSON input, and thrown server errors.  Server errors are logged according to the [environment settings](../../README.md).

# Routes

The API version is part of the URL.  So all version 1 routes start vith `/v1`, and all files pertaining to version 1 routes have `-v1` in their name.

