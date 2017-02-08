# API endpoints

## Manipulation & retrieval of objects

Creation, modification and retrieval of objects in the database are achieved by using the following service API:

### Community

| Endpoint                             | POST | PUT | GET |
| ------------------------------------ |:----:|:---:|:---:|
| `/community`                         | X    |     |     |
| `/community/`*name*                  |      |     | X   |
| `/community/`*id*                    |      | X   | X   |
| `/community/`*id*`/name`             |      | X   | X   |
| `/community/`*id*`/attributes`       | X    | X   | X   |
| `/community/`*id*`/attributes/`*key* |      | X   | X   |

- POST on `/community` sets `created_epoch`.
- POST & PUT on other endpoints sets `modified_epoch` & `modified_by`.
- PUT on `/community/`*id* can set `deleted_epoch`.

### Profile

| Endpoint                                            | POST | PUT | GET |
| --------------------------------------------------- |:----:|:---:|:---:|
| `/community/`*id*`/profile`                         | X    |     |     |
| `/community/`*id*`/profile/`*id*                    |      | X   | X   |
| `/community/`*id*`/profile/`*id*`/name`             |      | X   | X   |
| `/community/`*id*`/profile/`*id*`/attributes`       | X    | X   | X   |
| `/community/`*id*`/profile/`*id*`/attributes/`*key* |      | X   | X   |

- POST on `/profile` sets `created_epoch`.
- POST & PUT on other endpoints sets `modified_epoch` & `modified_by`.
- PUT on `/profile/`*id* can set `deleted_epoch` & `deleted_by`.

### Entity

| Endpoint                                            | POST | PUT | GET |
| --------------------------------------------------- |:----:|:---:|:---:|
| `/community/`*id*`/entity`                          | X    |     |     |
| `/community/`*id*`/entity/`*id*                     |      | X   | X   |
| `/community/`*id*`/entity/`*id*`/title`             |      | X   | X   |
| `/community/`*id*`/entity/`*id*`/contents`          |      | X   | X   |
| `/community/`*id*`/entity/`*id*`/startTime`         |      | X   | X   |
| `/community/`*id*`/entity/`*id*`/endTime`           |      | X   | X   |
| `/community/`*id*`/entity/`*id*`/attributes`        | X    | X   | X   |
| `/community/`*id*`/entity/`*id*`/attributes/`*key*  |      | X   | X   |

- POST on `/entity` sets `created_epoch`.
- POST & PUT on other endpoints sets `modified_epoch` & `modified_by`.
- PUT on `/entity/`*id* can set `deleted_epoch` & `deleted_by`.

### Action

| Endpoint                                            | POST | PUT | GET |
| --------------------------------------------------- |:----:|:---:|:---:|
| `/community/`*id*`/action`                          | X    |     |     |
| `/community/`*id*`/action/`*id*                     |      |     | X   |
| `/community/`*id*`/action/`*id*`/startTime`         |      | X   | X   |
| `/community/`*id*`/action/`*id*`/endTime`           |      | X   | X   |
| `/community/`*id*`/action/`*id*`/attributes`        | X    | X   | X   |
| `/community/`*id*`/action/`*id*`/attributes/`*key*  |      | X   | X   |

- POST on `/action` sets `created_epoch`.
- POST & PUT on other endpoints sets `modified_epoch` & `modified_by`.
- PUT on `/action/`*id* can set `deleted_epoch` & `deleted_by`.

## Complex queries

The endpoint `/query` accepts complex [queries](query-language.md), either as a GET request with the query encoded by [jsurl](https://www.npmjs.com/package/jsurl), or as a POST request with the body contining the unencoded JSON query.



