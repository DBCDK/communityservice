# Simple API endpoints

The simple endpoints mainly operate on a single database object.  Consult the [schemas for the database](db-model.md) for the exact contents of each type of object.

## Manipulation & retrieval of objects

Creation, modification and retrieval of objects in the database are achieved by using the following service API.

HTTP GET & POST have standard semantics.

HTTP PUT either works as a selective update or as a delete.  More specifically,

- If the client-sent object *only* has a `modified_by` property, then the object is marked as deleted by setting the `deleted_epoch` and `deleted_by` (instead of `modified_epoch` and `modified_by`).
- If the client-sent object mentions some (non-empty) subset of the existing properties on the server object, then only the mentioned properties are updated, and `deleted_epoch` and `deleted_by` are cleared.
- If the client-sent object mentions `attributes`, the values of `attributes` has to be an object, and the attributes are selectively updated.  To delete an attribute, set its value to null.

### Community

| Endpoint                                | POST | PUT | GET |
| --------------------------------------- |:----:|:---:|:---:|
| `/v1/community`                         | X    |     | X   |
| `/v1/community/`*name*                  |      |     | X   |
| `/v1/community/`*id*                    |      | X   | X   |

- POST on `/community` sets `created_epoch`.

### Profile

| Endpoint                                               | POST | PUT | GET |
| ------------------------------------------------------ |:----:|:---:|:---:|
| `/v1/community/`*id*`/profile`                         | X    |     | X   |
| `/v1/community/`*id*`/profile/`*id*                    |      | X   | X   |

- POST on `/profile` sets `created_epoch` & `modified_epoch`.
- PUT on `/profile/`*id* sets `modified_epoch` & `modified_by`.
- PUT on `/profile/`*id* can set `deleted_epoch` & `deleted_by`.

### Entity

| Endpoint                                               | POST | PUT | GET |
| ------------------------------------------------------ |:----:|:---:|:---:|
| `/v1/community/`*id*`/entity`                          | X    |     | X   |
| `/v1/community/`*id*`/entity/`*id*                     |      | X   | X   |

- POST on `/entity` sets `created_epoch` & `modified_epoch`.
- PUT on `/entity/`*id* sets `modified_epoch` & `modified_by`.
- PUT on `/entity/`*id* can set `deleted_epoch` & `deleted_by`.

### Action

| Endpoint                                               | POST | PUT | GET |
| ------------------------------------------------------ |:----:|:---:|:---:|
| `/v1/community/`*id*`/action`                          |  X   |     | X   |
| `/v1/community/`*id*`/action/`*id*                     |      | X   | X   |

- POST on `/action` sets `created_epoch` & `modified_epoch`.
- PUT on `/action/`*id* sets `modified_epoch` & `modified_by`.
- PUT on `/action/`*id* can set `deleted_epoch` & `deleted_by`.

## Complex queries

The endpoint `/query` accepts complex [queries](query-language.md) as a POST request with the body contining the unencoded JSON query.
