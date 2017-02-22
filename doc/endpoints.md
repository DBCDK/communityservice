# API endpoints

## Manipulation & retrieval of objects

Creation, modification and retrieval of objects in the database are achieved by using the following service API.
Parts in parentheses are not implemented yet.

### Community

| Endpoint                                | POST | PUT | GET |
| --------------------------------------- |:----:|:---:|:---:|
| `/v1/community`                         | X    |     | X   |
| `/v1/community/`*name*                  |      |     | X   |
| `/v1/community/`*id*                    |      | X   | X   |
| `/v1/community/`*id*`/name`             |      |     |     |
| `/v1/community/`*id*`/attributes`       | (X)  | (X) | (X) |
| `/v1/community/`*id*`/attributes/`*key* |      | (X) | (X) |

- POST on `/community` sets `created_epoch`.
- POST & PUT on other endpoints sets `modified_epoch`.
- (PUT on `/community/`*id* can set `deleted_epoch`.)

### Profile

| Endpoint                                               | POST | PUT | GET |
| ------------------------------------------------------ |:----:|:---:|:---:|
| `/v1/community/`*id*`/profile`                         | X    |     | X   |
| `/v1/community/`*id*`/profile/`*id*                    |      | X   | X   |
| `/v1/community/`*id*`/profile/`*id*`/name`             |      | (X) | (X) |
| `/v1/community/`*id*`/profile/`*id*`/attributes`       | X    | X   | X   |
| `/v1/community/`*id*`/profile/`*id*`/attributes/`*key* |      | (X) | (X) |

- POST on `/profile` sets `created_epoch`.
- POST & PUT on other endpoints sets `modified_epoch` & `modified_by`.
- PUT on `/profile/`*id* can set `deleted_epoch` & `deleted_by`.

### Entity

| Endpoint                                               | POST | PUT | GET |
| ------------------------------------------------------ |:----:|:---:|:---:|
| `/v1/community/`*id*`/entity`                          | X    |     | X   |
| `/v1/community/`*id*`/entity/`*id*                     |      | X   | X   |
| `/v1/community/`*id*`/entity/`*id*`/title`             |      | (X) | (X) |
| `/v1/community/`*id*`/entity/`*id*`/contents`          |      | (X) | (X) |
| `/v1/community/`*id*`/entity/`*id*`/start_epoch`       |      | (X) | (X) |
| `/v1/community/`*id*`/entity/`*id*`/end_epoch`         |      | (X) | (X) |
| `/v1/community/`*id*`/entity/`*id*`/attributes`        | X    | X   | X   |
| `/v1/community/`*id*`/entity/`*id*`/attributes/`*key*  |      | (X) | (X) |

- POST on `/entity` sets `created_epoch`.
- POST & PUT on other endpoints sets `modified_epoch` & `modified_by`.
- PUT on `/entity/`*id* can set `deleted_epoch` & `deleted_by`.

### Action

| Endpoint                                               | POST | PUT | GET |
| ------------------------------------------------------ |:----:|:---:|:---:|
| `/v1/community/`*id*`/action`                          | X    |     | X   |
| `/v1/community/`*id*`/action/`*id*                     |      |     | X   |
| `/v1/community/`*id*`/action/`*id*`/start_epoch`       |      | (X) | (X) |
| `/v1/community/`*id*`/action/`*id*`/end_epoch`         |      | (X) | (X) |
| `/v1/community/`*id*`/action/`*id*`/attributes`        | X    | X   | X   |
| `/v1/community/`*id*`/action/`*id*`/attributes/`*key*  |      | (X) | (X) |

- POST on `/action` sets `created_epoch`.
- POST & PUT on other endpoints sets `modified_epoch` & `modified_by`.
- PUT on `/action/`*id* can set `deleted_epoch` & `deleted_by`.

## Complex queries

The endpoint `/query` accepts complex [queries](query-language.md), either as a GET request with the query encoded by [jsurl](https://www.npmjs.com/package/jsurl), or as a POST request with the body contining the unencoded JSON query.
