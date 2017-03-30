# Requirements

- **Time-based expiry**: Events like Contests expire at some point in the future when they are created, so there should be an `expireTime` as well as a `deleteTime`.  And for campaigns there should also be a `startTime` and `endTime`.
- **Must run on PostgreSQL 9.4**
- **Use DBC logger**: Use [dbc logger](https://github.com/DBCDK/hejmdal/blob/master/src/utils/logging.util.js) instead of console.log().
- **Configuration of Elvis must come through environment variables**: Look at ufo and hejmdal to get the big picture.
- **Log all changes**: To make decisions regarding complaints & bans & legal investigations, As a community administrator, I want to be able to extract when and what was changed by users of community, if necessary.  The purpose is to assist in rare cases, so there should not be any fancy interface, just a log of what happened, who did it, and when.
- **Deleted objects should not be included by default**. 
- **It must be easy to extract the context of eg. a comment**.


# Nice to have

- **Queries across several Service Ids**: There might be need for cross-service queries, for instance, all reviews of this book.
- **Elasticsearch**: Elvis should probably send created data to Elasticsearch, and maybe also proxy searches from services to Elasticsearch.  DBC uses version 5.1.2
- **The service API should help with interactive completion on mentions (@)**.
- **The service API should help with extracting statistics**: "How many non-admin comment originate from library X in the last month?", "What is the mean age of reviews on Harry Potter 6?"
- **Query -> Result visualiser**: To visualise the structure of the result I will get from the Elvis API, As a community developer, I want a tool that takes as input a JSON query for the Elvis API and outputs the resulting JSON structure, preferably interactive.


# Non-requirements

- **Quarantine, flagging, moderation, etc. is handled by the community, not by Elvis**.
- **Community administrators must have a profile on the community**: Which means that we can always log who made changes by a `Profile.id`.
- **A community identifies itself by the API endpoint it uses**: So a community could ask the Elvis API eg. `GET /service/biblo` to get the endpoint to use to further communicate with the API.
