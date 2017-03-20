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
service.post('/v1/community/1/query')
.send({
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
})
````
