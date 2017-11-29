# Improvements

## Divide Actions

Because Actions can point to Entities and/or Profiles, the community has to keep Actions strictly separated by their type based on whether the Action points to a Profile, an Entity, or both.

Possible improvement (v3): Split Actions into three separate tables.

## More RESTful

Possible improvement (v2): Never use id numbers directly, always use the URL location.

Possible improvement (v3): Use HTTP PATCH instead of PUT, to get more in line with the intended semantics of REST.

## Increase reliability

Use [POST as ticket-to-update](https://docs.google.com/document/d/1s0joc0yb6kXpXZGfdE9SRutoPQuK9RVa77f92xsXzrM).
