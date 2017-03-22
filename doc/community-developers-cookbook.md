# Community Developers Guide

## Best books As a community developer I want to find the most recent reviews that give the highest rating

```js
service.post('/v1/community/1/query')
.send({
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

## To approve new reviews As admin I want to search for reviews that need approval

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

## To show a Biblo-like profile page

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

## Deleted objects


```json
{
  "Entity": {"id": 6177},
  "IncludeEntitiesRecursively": {
    "post": {"id": "id", "summary": "title", "owner": "owner_id"},
    "group": {"id": "id", "name": "title"}
  }
}
```

results in

```json
{
  "data": {
    "group": {
      "id": 28,
      "name": "Dolorem accusantium deserunt",
      "post": {
        "id": null,
        "summary": null,
        "owner": null,
        "deleted_epoch": 1489959016,
        "post": {
          "id": 5104,
          "summary": "Aliquid nisi quae",
          "owner": 211,
          "post": {
            "id": 6177,
            "summary": "Enim beatae fugit",
            "owner": 575
          }
        }
      }
    }
  }
}
```
