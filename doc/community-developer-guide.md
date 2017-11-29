# Community Developer's Guide

This guide contains examples of how you as a community developer can use the [community service](https://github.com/DBCDK/communityservice).  For a detiailed description of the API, see the [endpoints](doc/endpoints.md), [query language](doc/query-language.md), and the underlying [database model](doc/db-model.md).

All interaction with the service is in [JSON](http://json.org) format over HTTP.  The input to the service through `POST` and `PUT` is just objects in JSON format that must adhere to the appropriate [schema](../src/server/v2/schemas/).  The output is in a [JSON-API](http://jsonapi.org/)-like format, see [output schemas](../src/server/schemas/readme.md).


## Manipulation of data

### Creating a new community.

A new community is created by `POST`ing [a community object](../src/server/v2/schemas/community-post.json) to `/v1/community`:

```js
{name: 'Biblo', attributes: {production: false}}
```

The attributes are optional and can be used to store arbitrary data.

The HTTP result is:

```
HTTP/1.1 201 Created
Location: /v1/community/2
Content-Type: application/json; charset=utf-8
Content-Length: 160

{
  "data": {
    "attributes": {
      "production": false
    },
    "created_epoch": 1490266740,
    "deleted_epoch": null,
    "id": 2,
    "log": null,
    "name": "Biblo"
  },
  "links": {
    "self": "/v1/community/1"
  }
}
```

A community can ask for its URL prefix by a `GET` on its name, eg. `/v1/community/Biblo`, which will respond with the same body as above.

From then on, all communication is performed through the id of the community.  In the rest of this guide we will assume that we are using community 1.

## Creating a user profile

A new profile is created by `POST`ing [a profile object](../src/server/v2/schemas/profile-post.json) to `/v1/community/1/profile`:

```js
{ name: 'Anders'
, attributes: {email: '...', avatar: 'http://...', biblios: ['Herlev']}
}
```

The attributes are optional and can be used to store arbitrary data.

### Creating a group, review, post

All objects that hold real contents are called *entities*, which include groups, reviews, posts, comment, campaigns, etc.

To create a group, you can `POST` an [entity object](../src/server/v2/schemas/entity-post.json) to `/v1/community/1/entity`:


```js
{ owner_id: 3
, type: 'group'
, title: 'Minecraft Super'
, contents: 'Her viser vi alle de flotte og skøre ting vi har bygget...'
, attributes: { picture: 'http://...'}
}
```

The `owner_id` is required and refers the id of an existing profile.

The `type` is free text and should be used to distinguish various entities from each other.

The `title` and `contents` are free text.

The attributes are optional and can be used to store arbitrary data.

There are other optional properties with predefined meaning: `start_epoch`, `end_epoch`, `entity_ref`.

The time properties (`start_epoch` and `end_epoch`) can be use in, say, campaigns to set a start and/or end date:

```js
{ owner_id: 4
, type: 'campaign'
, title: 'Flotteste sommerhus'
, contents: 'Byg det flotteste sommerhus og vind en iPad'
, start_epoch: 1489959016
, start_epoch: 1489972209
, entity_ref: 2
}
```

The `entity_ref` refers to another entity; in this case it could be the *Minecraft Super* group.  In general, the meaning of `entity_ref` is that, if entity A has a reference to entity B, then A belongs to B.  So if the campaign above has id 5, you can create a comment from profile 31 to the campaign by `POST`ing to `/v1/community/1/entity`:

```js
{ owner_id: 31
, type: 'comment'
, title: 'Kun sommerhuse?'
, contents: 'Må jeg bygge en jagtjytte?'
, entity_ref: 5
}
```


### Creating members, likes, follows

Objects that hold no content but just exist to link profiles and entities together are called *actions*.

To make profile 3 a member of group 2, you can `POST` an [action object](../src/server/v2/schemas/action-post.json) to `/v1/community/1/action`.

```js
{ owner_id: 3
, type: 'member'
, entity_ref: 2
, attributes: { approved: false }
}
```

The `owner_id` is required and refers the id of an existing profile.

The `type` is free text and should be used to distinguish various actions from each other.

The optional `entity_ref` and `profile_ref` must refer to an existing entity and profile, respectively, if set.

The attributes are optional and can be used to store arbitrary data.

To make profile 3 follow profile 27:

```js
{ owner_id: 3
, type: 'follow'
, profile_ref: 27
}
```

## Complex queries

Complex queries are made by `POST`ing a query to `/v1/community/1/query` or `/v1/community/1/query/include-deleted`, see the [query language](query-language.md) for a precise description.

Here is a number of examples showing how to do create common community views.

### Find reviews that need approval

*To approve new reviews, as admin I want to see the 100 oldest reviews that need approval.*

```js
{
  Entities: {type: 'review', 'attributes.approvedBy': null},
  Limit: 100,
  Order: 'ascending',
  Include: {
    id: 'id',
    headline: 'title',
    review: 'contents',
    image: 'attributes.picture',
    profile: {
      Profile: {id: '^owner_id'},
      Include: {id: 'id', name: 'name'}
    }
  }
}
```

### Recent reviews with highest ranking

*As a community developer I want to show the 5 most recent reviews with the highest rating, and I want an easy way to show the next page.*

```js
{
  Entities: {
    type: 'review',
    created_epoch: {operator: 'newerThan', value: 14, unit: 'daysAgo'}
  },
  Limit: 5,
  SortBy: 'attributes.rating',
  Include: {
    id: 'id',
    review: 'contents',
    image: 'attributes.picture',
    profile: {
      Profile: {id: '^owner_id'},
      Include: {id: 'id', name: 'name'}
    }
  }
})
```

Result:

```json
{
  "data": {
    "Total": 1985,
    "NextOffset": 5,
    "List": [
      {
        "id": 680,
        "review": "Nam soluta blanditiis fugit minus reiciendis...",
        "image": "http://...",
        "profile": {
          "id": 6,
          "name": "Janae"
        }
      },
      {
        "id": 700,
        "review": "Quia repellat deleniti est et odit...",
        "image": "http://...",
        "profile": {
          "id": 16,
          "name": "Tiffany"
        }
      },
      {
        "id": 679,
        "review": "Molestiae laboriosam eos et pariatur ad quia vel sed asperiores...",
        "image": "http://...",
        "profile": {
          "id": 6,
          "name": "Janae"
        }
      },
      {
        "id": 693,
        "review": "Minima et unde consequatur modi. Nesciunt rerum velit sit quis maxime illo...",
        "image": "http://...",
        "profile": {
          "id": 16,
          "name": "Tiffany"
        }
      },
      {
        "id": 689,
        "review": "Quo quidem et aut nesciunt in provident beatae ut...",
        "image": "http://...",
        "profile": {
          "id": 15,
          "name": "Shaylee"
        }
      }
    ]
  }
}
```

So the next page can be generated by using `NextOffset` from the result:

```js
{
  Entities: {
    type: 'review',
    created_epoch: {operator: 'newerThan', value: 14, unit: 'daysAgo'}
  },
  Limit: 5,
  Offset: 5,
  SortBy: 'attributes.rating',
  Include: {
    id: 'id',
    review: 'contents',
    image: 'attributes.picture',
    profile: {
      Profile: {id: '^owner_id'},
      Include: {id: 'id', name: 'name'}
    }
  }
})
```

When there are no more result, the result will contain `"NextOffset": null`.

### Include chain of referenced entities

*To show the thread that action 524 (a "like") points to, as a community developer I want to follow the entity reference all the way to the root.*

```js
{ Action: { id: 524 }
, IncludeEntitiesRecursively:
  { like: {id: 'id', who: 'owner_id'}
  , post: {id: 'id', text: 'title'}
  , group: {id: 'id', name: 'title'}
  }
}
```

Result:

```json
{
  "group": {
    "id": 62,
    "name": "Dolorum qui omnis",
    "post": {
      "id": 246,
      "text": "Iusto sapiente eum",
      "post": {
        "id": 2722,
        "text": "Voluptas et vel",
        "post": {
          "id": 4128,
          "text": "Asperiores eligendi rerum",
          "like": {
            "id": 524,
            "who": 61
          }
        }
      }
    }
  }
}
```

### Front page

*To show a Biblo-like profile page for user 15.*

```js
{
  Profile: {
    id: 15
  },
  Include: {
    stickers: 'attributes.stickers',
    group: {
      CountActions: {
        type: 'member',
        owner_id: '^id'
      }
    },
    avatar: 'attributes.avatar',
    name: 'name',
    description: 'attributes.description',
    reviews: {
      Entities: {
        type: 'review',
        owner_id: '^id'
      },
      Limit: 2,
      Include: {
        id: 'id',
        review: 'contents',
        rating: 'attributes.rating',
        image: 'attributes.image',
        name: 'title',
        sticker: 'attributes.sticker'
      }
    },
    activity: {
      Entities: {
        owner_id: '^id'
      },
      Limit: 2,
      IncludeEntitiesRecursively: {
        comment: {
          id: 'id',
          name: {
            Profile: {
              id: '^id'
            },
            Include: 'name'
          },
          avatar: {
            Profile: {
              id: '^id'
            },
            Include: 'attributes.avatar'
          },
          created: 'created_epoch',
          comment: 'contents',
          likes: {
            CountActions: {
              entity_ref: 'id'
            }
          }
        },
        post: {
          id: 'id',
          name: {
            Profile: {
              id: '^owner_id'
            },
            Include: 'name'
          },
          avatar: {
            Profile: {
              id: '^owner_id'
            },
            Include: 'attributes.avatar'
          },
          created: 'created_epoch',
          post: 'contents',
          likes: {
            CountActions: {
              entity_ref: '^id'
            }
          }
        },
        group: {
          id: 'id',
          name: 'title'
        }
      }
    },
    messages: {
      Actions: {
        type: 'fine',
        profile_ref: '^id'
      },
      Limit: 3,
      Include: {
        id: 'id',
        modifed: 'modified_epoch',
        type: 'type',
        returnDate: 'attributes.returnDate',
        title: 'attributes.workTitle'
      }
    }
  }
}
```

### Group page

*Display a view of group 1, including 3 posts with 2 comments each, and the latest 4 followers; the group and all posts/comments must include number of likes, and all posts/comments must include profile name, and when created.*

```js
{ Entity: { type: 'group', id: 1 }
, Include:
  { id: 'id'
  , name: 'title'
  , description: 'contents'
  , posts:
    { Entities: { type: 'post', entity_ref: '^id' }
    , SortBy: 'created_epoch'
    , Limit: 3
    , Include:
      { id: 'id'
      , created: 'created_epoch'
      , post: 'contents'
      , image: 'attributes.attachment'
      , likes: { CountActions: { type: 'like', entity_ref: '^id' } } }
      , profile:
        { Profile: { id: '^owner_id' }
        , Include: { id: 'id', name: 'name', avatar: 'attributes.avatar' }
        }
      , comments:
        { Entities: { type: post, entity_id: '^id' }
        , SortBy: 'created_epoch'
        , Limit: 2
        , Include:
          { comment: 'contents'
          , created: 'created_epoch'
          , likes: { CountActions: { type: 'like', entity_ref: '^id' } } }
          , profile:
            { Profile: { id: '^owner_id' }
            , Include: { id: 'id', name: 'name', avatar: 'attributes.avatar' }
            }
          }
        }
      }
    }
  , followers:
    { Actions: { type: 'member', entity_ref: '^id' }
    , Limit: 4
    , SortBy: 'created_epoch'
    , Include:
      { id: 'profile_ref'
      , avatar:
        { Profile: { id: '^profile_ref' }
        , Include: 'attributes.avatar'
        }
      }
    }
  }
}
```

## Logs

Each profile, entity, and action has a built-in log that gets updated on each change.  To retrieve the log, request the object directly, eg.

    GET /v1/community/1/entity/388

will produce something like

```json
{ "links": { "self": "/v1/community/1/entity/388" }
, "data":
  { "id": 388
  , "created_epoch": 1490363217
  , "deleted_epoch": null
  , "modified_epoch": 1490363614
  , "modified_by": 417
  , "deleted_by": null
  , "community_id": 1
  , "owner_id": 417
  , "start_epoch": null
  , "end_epoch": null
  , "entity_ref": 92
  , "type": "post"
  , "title": "Exercitationem est maxime"
  , "contents": "Rerum ullam odit dolores ..."
  , "attributes": { "picture": "http://lorempixel.com/640/480/animals" }
  , "log":
    [ { "attributes": { "picture": null }
      , "modified_by": 417
      , "modified_epoch": 1490363614
      }
    ]
  }
}
```

The log entry records when the change was made, who made the change, and what changed.
