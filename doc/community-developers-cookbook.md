# Community Developers Cookbook

This cookbook contains examples of how you as a community developer can use the [community service](https://github.com/DBCDK/communityservice).  For a detiailed description of the API, see the [endpoints](doc/endpoints.md), [query language](doc/query-language.md), and the underlying [database model](doc/db-model.md).

All interaction with the service is in [JSON](http://json.org) format over HTTP.  The input to the service through `POST` and `PUT` is just objects in JSON format that must adhere to the appropriate [schema](src/server/v1/schemas/).  The output is in a [JSON-API](http://jsonapi.org/)-like format, see [output schemas](src/server/schemas/readme.md).


## Manipulation of data

### Creating a new community.

A new community is created by `POST`ing [a community object](src/server/v1/schemas/community-post.json) to `/v1/community`:

```js
{name: 'Biblo', attributes: {production: false}}
```

The attributes are optional and can be used to store arbitrary data.

From then on, all communication is performed through the id of the community.  So if `GET /v1/community/Biblo` returns 1, all endpoints for Biblo will be prefixed by `/v1/community/1`.  In the rest of this cookbook, we will assume that we are using community 1.

## Creating a user profile

A new profile is created by `POST`ing [a profile object](src/server/v1/schemas/profile-post.json) to `/v1/community/1/profile`:

```js
{ name: 'Anders'
, attributes: {email: '...', avatar: 'http://...', biblios: ['Herlev']}
}
```

The attributes are optional and can be used to store arbitrary data.

### Creating a group, review, post

All objects that hold real contents are called *entities*, so to create a group, you can `POST` an [entity object](src/server/v1/schemas/entity-post.json) to `/v1/community/1/entity`:


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

The `entity_ref` refers to another entity; in this case it could be the *Minecraft Super* group.  In general, the meaning of `entity_ref` is that, if entity A has a reference to entity B, then A belongs to B.

### Creating members, likes, follows

All objects that hold no contents but just exist to link profiles and entities together are called *actions*, so to create a member of a group, you can `POST` an [action object](src/server/v1/schemas/action-post.json) to `/v1/community/1/action`.  So to make profile 3 a member of group 2:

```js
{ owner_id: 3
, type: 'member'
, entity_ref: 2
, attributes: { approved: false }
}
```

The attributes are optional and can be used to store arbitrary data.

To make profile 3 follow profile 27:

```js
{ owner_id: 3
, type: 'member'
, profile_ref: 27
}
```

## Complex queryies

Complex queries are made by `POST`ing to `/v1/community/1/query`:

*As a community developer I want to find the most recent reviews that give the highest rating.*

```js
{
  Entities: {
    type: 'review',
    created_epoch: {operator: 'newerThan', value: 14, unit: 'daysAgo'}
  },
  Limit: 8,
  SortBy: 'attributes.rating',
  Order: 'descending',
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

*To approve new reviews As admin I want to search for reviews that need approval.*

```js
{
  Entities: {type: 'review', 'attributes.approvedBy': null},
  Limit: 100,
  Order: 'ascending',
  Include: {
    id: 'id',
    review: 'contents',
    image: 'attributes.picture',
    profile: {
      Profile: {id: '^owner_id'},
      Include: {id: 'id', name: 'name'}
    }
  }
}
```

*To show a Biblo-like profile page.*

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
