# API endpoints

## Manipulation & retrieval of objects

Creation, modification and retrieval of objects in the database are achieved by using the following service API:

### Profile

| Endpoint                           | POST | PUT | DELETE | GET |
| ---------------------------------- |:----:|:---:|:------:|:---:|
| `/profile`                         | X    |     |        |     |
| `/profile/`*id*                    |      | X   | X      | X   |
| `/profile/`*id*`/name`             |      | X   |        | X   |
| `/profile/`*id*`/attributes`       | X    | X   |        | X   |
| `/profile/`*id*`/attributes/`*key* | X    | X   | X      | X   |

- POST on `/profile` sets `createdTime` & `modifiedTime`.
- DELETE on `/profile/`*id* sets `deletedTime`.
- POST, PUT & DELETE on other endpoints sets `modifiedTime`.

### Entity

| Endpoint                           | POST | PUT | DELETE | GET |
| ---------------------------------- |:----:|:---:|:------:|:---:|
| `/entity`                          | X    |     |        |     |
| `/entity/`*id*                     |      | X   | X      | X   |
| `/entity/`*id*`/title`             |      | X   |        | X   |
| `/entity/`*id*`/contents`          |      | X   |        | X   |
| `/entity/`*id*`/startTime`         |      | X   | X      | X   |
| `/entity/`*id*`/endTime`           |      | X   | X      | X   |
| `/entity/`*id*`/attributes`        | X    | X   |        | X   |
| `/entity/`*id*`/attributes/`*key*  | X    | X   | X      | X   |

- POST on `/entity` sets `createdTime` & `modifiedTime`.
- DELETE on `/entity/`*id* sets `deletedTime`.
- POST, PUT & DELETE on other endpoints sets `modifiedTime`.

### Action

| Endpoint                           | POST | PUT | DELETE | GET |
| ---------------------------------- |:----:|:---:|:------:|:---:|
| `/action`                          | X    |     |        |     |
| `/action/`*id*                     |      |     | X      | X   |
| `/action/`*id*`/startTime`         |      | X   | X      | X   |
| `/action/`*id*`/endTime`           |      | X   | X      | X   |
| `/action/`*id*`/attributes`        | X    | X   |        | X   |
| `/action/`*id*`/attributes/`*key*  | X    | X   | X      | X   |

- POST on `/action` sets `createdTime` & `modifiedTime`.
- DELETE on `/action/`*id* sets `deletedTime`.
- POST, PUT & DELETE on other endpoints sets `modifiedTime`.

## Complex queries

The endpoint `/query` accepts complex [queries](query-language.md), either as a GET request with the query encoded by [jsurl](https://www.npmjs.com/package/jsurl), or as a POST request with the body contining the unencoded JSON query.



