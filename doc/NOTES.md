# Data formats

## Profile page

To show a profile, Biblo needs data form Elvis like:

```json
{ "profile":
  { "id": 83531
  , "stickers":
    [ "https://biblo.dk/billede/3652"
    , "https://biblo.dk/billede/3831"
    ]
  , "groups": 34
  , "avatar": "https://biblo.dk/billede/83531"
  , "name": "Anders Friis"
  , "description": "Jeg arbejder for Biblo..."
  , "reviews":
    { "total": 4
    , "next-offset": 2
    , "list":
      [ { "id": 368431
        , "review": "En af de bedste film jeg har set længe..."
        , "likes": 1
        , "rating": 5
        , "image": "..."
        , "name": "A Film Noir"
        , "sticker": "https://biblo.dk/billede/3652"
        }
      , { "id": 368432
        , "review": "Den er rigtig god..."
        , "likes": 0
        , "rating": 4
        , "image": "..."
        , "name": "Magisterium"
        }
      ]
    }
  , "activity":
    { "total": 64
    , "next-offset": 2
    , "list":
      [ { "group":
          { "id": 4
          , "name": "Bogklubben"
          , "post":
            { "id": 319093
            , "name": "Navle"
            , "avatar": "..."
            , "created": 1485219736
            , "post": "hej mit navn er Caroline ... rigtig god"
            , "comment":
              { "id": 137362
              , "name": "Anders Friis"
              , "avatar": "...."
              , "created": 1485219799
              , "comment": "Man kan se dem lige her..."
              , "likes": 3
              }
            }
          }
        }
      , { "group":
          { "id": 4
          , "name": "yahya hassan fangruppen"
          , "post":
            { "id": 883319
            , "name": "Anders Friis"
            , "avatar": "..."
            , "created": 14852024112
            , "post": "Er der kampagne her?"
            , "sticker": "https://biblo.dk/billede/3831"
            , "likes": 0
            }
          }
        }
      ]
    }
  , "messages":
    { "total": 1
    , "next-offset": 1
    , "list":
      [ { "id": "836463"
        , "created": 14852025533
        , "type": "fine"
        , "return-date": 14852016385
        , "title": "Nausicaä fra vindenes dal"
        }
      ]
    }
  }
}
```

The query to Elvis would be like:


```json


```

## Landing page

### Newest reviews

To show the three newest reviews, Biblo needs data from Elvis like:

```json
{ "reviews":
  { "total": 321
  , "next-offset": 3
  , "list":
    [ { "id": 79346
      , "profile":
        { "id": 50708
        , "name": "Pokemon Gamer"
        }
      , "review": "jeg syndes den er god for små børn så de lærer om modsætninger men den er ikke noget for store børn"
      , "rating": 5
      , "image": "http://book-cover...png"
      }
    , { "id": 87453
      , "profile":
        { "id": 55321
        , "name": "Alberte2701"
        }
      , "review": "Isabella Swan flytter fra den solrige by Phoenix, til den kedelige by ..."
      , "rating": 3
      , "image": "http://book-cover...png"
      }
    , { "id": 79321
      , "profile":
        { "id": 65231
        , "name": "maiken og celton"
        }
      , "review": "den er sjov vikelig god syntes i skal læse den"
      , "rating": 4
      , "image": "http://book-cover...png"
      }
    ]
  }
}
```

The query to Elvis would be like:

```json
{ "reviews":
  { "List":
    { "Entity": { "type": "review" }
    , "sort-by": "createdDate"
    , "order": "descending"
    , "offset": 0
    , "limit": 3
    , "include":
      { "id": "id"
      , "review": "content"
      , "rating": "attribute.rating"
      , "image": "attribute.?"
      , "profile":
        { "Object":
          { "Profile": { "id": "reviews.profileId" }
          , "include":
            { "id": "id"
            , "name": "attribute.name"
            }
          }
        }
      }
    }
  }
}
```


### What happens in…(various predefined categories/groups) (#limited), More

### Trailers (#limited), More

### Popular groups (#limited), More

### Books (#limited). More

## Complex example

To display a view of a group with id 1, including 3 posts with 2 comments each, and the latest 4 followers; the group and all posts/comments must include number of likes, and all posts/comments must include profile name, and when created.  For this view, Biblo needs data from Elvis like:

```json
{ "group":
  { "id": 1
  , "name": "Minecraft i Palleland"
  , "description": "Denne gruppe er til alle jer der spiller Minecraft, eller..."
  , "posts":
    { "total": 632
    , "next-offset": 3
    , "list":
      [ { "id": 8464133
        , "created": 1485218242
        , "post": "Idag har vores allesammens yndlingsadmin fødselsdag! Tillykke til Haslevbibliotek1/Morten :)"
        , "image": "https://biblo.dk/billede/8115/original"
        , "likes": 2
        , "profile":
          { "id": 937215
          , "name": "Din_laerer/Tea"
          , "avatar": "https://biblo.dk/billede/937215"
          }
        , "comments":
          { "total": 1
          , "next-offset": null
          , "list":
            [ { "comment": "Aj, hvor har jeg bare en sød kæreste. Stort knus din vej. :-)"
              , "created": 1485219736
              , "likes": 0
              , "profile":
                { "id": 535305
                , "name": "HaslevBibliotek1/Morten"
                , "avatar": "https://biblo.dk/billede/535305"
                }
              }
            ]
          }
        }
      , { "id": 557320
        , "created": 1485174523
        , "post": "Nicole fra Svendborg Graphic har skrevet dette indlæg i sin gruppe. Du kan også se det her: biblo.dk/grupper/667"
        , "image": "https://biblo.dk/billede/8114/original"
        , "likes": 2
        , "profile":
          { "id": 535305
          , "name": "HaslevBibliotek1/Morten"
          , "avatar": "https://biblo.dk/billede/535305"
          }
        , "comments": { "total": 0, "next-offset": null, "list": [] }
        }
      , { "id": 999487
        , "created": 1485023745
        , "post": "Hej HaslevBibliotek1/Morten! For 218 dage siden spurgte jeg om man også kunne joine på iPad. Der skrev du nej og at du håbede jeg ville købe det. Nu har jeg så købt det men det virker ikke når jeg joiner! PS: Jeg er også virkelig dårlig til at spille Minecraft og idag er første gang jeg spiller på computer."
        , "image": null
        , "likes": 1
        , "profile":
          { "id": 330482
          , "name": "Carl_Emil17"
          , "avatar": "https://biblo.dk/billede/330482"
          }
        , "comments":
          { "total": 2
          , "next-offset": null
          , "list":
            [ { "comment": "Har du husket at rette versionen til 1.8.9 under \"Edit profile\" i det første vindue der kommer op?"
              , "created": 1485016553
              , "likes": 1
              , "profile":
                { "id": 933664
                , "name": "BornholmBib/Kenneth"
                , "avatar": "https://biblo.dk/billede/933664"
                }
              }
            , { "comment": "Nåh ja"
              , "created": 1485016973
              , "likes": 0
              , "profile":
                { "id": 330482
                , "name": "Carl_Emil17"
                , "avatar": "https://biblo.dk/billede/330482"
                }
              }
            ]
          }
        }
      ]
    }
  , "host":
    { "id": "12471"
    , "avatar": "https://biblo.dk/billede/12471"
    }
  , "followers":
    { "total": 283
    , "next-offset": 4
    , "list":
      [ { "id": "45599"
        , "avatar": "https://biblo.dk/billede/45599"
        }
      , { "id": "21653"
        , "avatar": "https://biblo.dk/billede/21653"
        }
      , { "id": "63521"
        , "avatar": "https://biblo.dk/billede/63521"
        }
      , { "id": "32731"
        , "avatar": "https://biblo.dk/billede/32731"
        }
      ]
    }
  }
}
```

The query to Elvis would be like:

```json
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
```
