# Product Vision

*Community Service* provides a small, well-defined set of building blocks that make it easy to build online communities.

The service provides a minimalistic API that makes it easy and intuitive for software developers to create communities like(https://biblo.dk/), where users can present, review and discuss topics of their choice relating to external media.

The building blocks are comprised of a REST API that makes it possible for community developers to create, control or link entities like user profiles, groups, posts, ratings, followers, etc., and to retrieve data from the entities again to form Views that can be presented back to the users.

The API provides a small number of basic entities, relations and attributes that are expected to be present in any kind of online community, and the API supports community-specific attributes to be attached to entities and used in queries for generating views.

The API makes it possible to query the data for any View in a single request, no matter how the underlying entities are linked or arranged.  The data returned has a firm, predictable structure that makes it easy to construct complicated views.

