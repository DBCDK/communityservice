const jsurl = require('jsurl');
const query = `
{ "group":
  { "Object":
    { "Entity": { "type": "group", "id": 1 }
    , "include":
      { "id": "id"
      , "name": "attribute.name"
      , "description": "content"
      , "posts":
        { "List":
          { "Entity": { "type": "post", "parentId": "group.id" }
          , "sort-by": "createdDate"
          , "order": "descending"
          , "offset": 0
          , "limit": 3
          , "include":
            { "id": "id"
            , "created": "created"
            , "post": "content"
            , "image": "attribute.attachment"
            , "likes": { "Count": { "Action": { "type": "like", "relationId": "posts.id" } } }
            , "profile":
              { "Object":
                { "Profile": { "id": "posts.profileId" }
                , "include":
                  { "id": "id"
                  , "name": "attribute.name"
                  , "avatar": "attribute.avatar"
                  }
                }
              }
            , "comments":
              { "List":
                { "Entity": { "type": "post", "topId": "posts.id" }
                , "sort-by": "createdDate"
                , "order": "descending"
                , "offset": 0
                , "limit": 2
                , "include":
                  { "comment": "content"
                  , "created": "created"
                  , "likes": { "Count": { "Action": { "type": "like", "relationId": "posts.id" } } }
                  , "profile":
                    { "Object":
                      { "Profile": { "id": "posts.profileId" }
                      , "include":
                        { "id": "id"
                        , "name": "attribute.name"
                        , "avatar": "attribute.avatar"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      , "host":
        { "Object":
          { "Profile": { "id": "group.attribute.host" }
          , "include":
            { "id": "profileId"
            , "avatar": "attribute.avatar"
            }
          }
        }
      , "followers":
        { "List":
          { "Action": { "type": "follow", "entityId": "group.id" }
          , "offset": 0
          , "limit": 4
          , "sort-by": "createDate"
          , "order": "descending"
          , "include":
            { "id": "profileId"
            , "avatar":
              { "Object":
                { "Profile": { "id": "followers.profileId" }
                , "yield": "attribute.avatar"
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

const obj = JSON.parse(query);
const url = jsurl.stringify(obj);
console.log(url);
console.log(JSON.stringify(obj,null,'  '));
