# Community Service database model

The database is created from scratch by [`src/server/v1/current-db.js`](../src/server/v1/current-db.js).
Migrations will be located in [`src/migrations`](../src/migrations/).

Here are the raw schemas as seen by PostgreSQL.

## Communities

```
                                                         Table "public.communities"
     Column     |          Type          |                        Modifiers                         | Storage  | Stats target | Description
----------------+------------------------+----------------------------------------------------------+----------+--------------+-------------
 id             | integer                | not null default nextval('communities_id_seq'::regclass) | plain    |              |
 created_epoch  | integer                | not null default date_part('epoch'::text, now())         | plain    |              |
 modified_epoch | integer                |                                                          | plain    |              |
 deleted_epoch  | integer                |                                                          | plain    |              |
 name           | character varying(255) |                                                          | extended |              |
 attributes     | json                   | not null default '{}'::json                              | extended |              |
Indexes:
    "communities_pkey" PRIMARY KEY, btree (id)
    "communities_name_unique" UNIQUE CONSTRAINT, btree (name)
Referenced by:
    TABLE "actions" CONSTRAINT "actions_community_id_foreign" FOREIGN KEY (community_id) REFERENCES communities(id)
    TABLE "entities" CONSTRAINT "entities_community_id_foreign" FOREIGN KEY (community_id) REFERENCES communities(id)
    TABLE "profiles" CONSTRAINT "profiles_community_id_foreign" FOREIGN KEY (community_id) REFERENCES communities(id)
```

## Profiles

```
                                                         Table "public.profiles"
     Column     |          Type          |                       Modifiers                       | Storage  | Stats target | Description
----------------+------------------------+-------------------------------------------------------+----------+--------------+-------------
 id             | integer                | not null default nextval('profiles_id_seq'::regclass) | plain    |              |
 created_epoch  | integer                | not null default date_part('epoch'::text, now())      | plain    |              |
 modified_epoch | integer                |                                                       | plain    |              |
 deleted_epoch  | integer                |                                                       | plain    |              |
 modified_by    | integer                |                                                       | plain    |              |
 deleted_by     | integer                |                                                       | plain    |              |
 community_id   | integer                | not null                                              | plain    |              |
 name           | character varying(255) | not null                                              | extended |              |
 attributes     | json                   | not null default '{}'::json                           | extended |              |
 log            | json                   |                                                       | extended |              |
Indexes:
    "profiles_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "profiles_community_id_foreign" FOREIGN KEY (community_id) REFERENCES communities(id)
    "profiles_deleted_by_foreign" FOREIGN KEY (deleted_by) REFERENCES profiles(id)
    "profiles_modified_by_foreign" FOREIGN KEY (modified_by) REFERENCES profiles(id)
Referenced by:
    TABLE "actions" CONSTRAINT "actions_deleted_by_foreign" FOREIGN KEY (deleted_by) REFERENCES profiles(id)
    TABLE "actions" CONSTRAINT "actions_modified_by_foreign" FOREIGN KEY (modified_by) REFERENCES profiles(id)
    TABLE "actions" CONSTRAINT "actions_owner_id_foreign" FOREIGN KEY (owner_id) REFERENCES profiles(id)
    TABLE "actions" CONSTRAINT "actions_profile_ref_foreign" FOREIGN KEY (profile_ref) REFERENCES profiles(id)
    TABLE "entities" CONSTRAINT "entities_deleted_by_foreign" FOREIGN KEY (deleted_by) REFERENCES profiles(id)
    TABLE "entities" CONSTRAINT "entities_modified_by_foreign" FOREIGN KEY (modified_by) REFERENCES profiles(id)
    TABLE "entities" CONSTRAINT "entities_owner_id_foreign" FOREIGN KEY (owner_id) REFERENCES profiles(id)
    TABLE "profiles" CONSTRAINT "profiles_deleted_by_foreign" FOREIGN KEY (deleted_by) REFERENCES profiles(id)
    TABLE "profiles" CONSTRAINT "profiles_modified_by_foreign" FOREIGN KEY (modified_by) REFERENCES profiles(id)
```

## Entities

```
                                                         Table "public.entities"
     Column     |          Type          |                       Modifiers                       | Storage  | Stats target | Description
----------------+------------------------+-------------------------------------------------------+----------+--------------+-------------
 id             | integer                | not null default nextval('entities_id_seq'::regclass) | plain    |              |
 created_epoch  | integer                | not null default date_part('epoch'::text, now())      | plain    |              |
 modified_epoch | integer                |                                                       | plain    |              |
 deleted_epoch  | integer                |                                                       | plain    |              |
 modified_by    | integer                |                                                       | plain    |              |
 deleted_by     | integer                |                                                       | plain    |              |
 community_id   | integer                | not null                                              | plain    |              |
 owner_id       | integer                | not null                                              | plain    |              |
 start_epoch    | integer                |                                                       | plain    |              |
 end_epoch      | integer                |                                                       | plain    |              |
 entity_ref     | integer                |                                                       | plain    |              |
 type           | character varying(255) | not null                                              | extended |              |
 title          | character varying(255) | not null                                              | extended |              |
 contents       | text                   | not null                                              | extended |              |
 attributes     | json                   | not null default '{}'::json                           | extended |              |
 log            | json                   |                                                       | extended |              |
Indexes:
    "entities_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "entities_community_id_foreign" FOREIGN KEY (community_id) REFERENCES communities(id)
    "entities_deleted_by_foreign" FOREIGN KEY (deleted_by) REFERENCES profiles(id)
    "entities_entity_ref_foreign" FOREIGN KEY (entity_ref) REFERENCES entities(id)
    "entities_modified_by_foreign" FOREIGN KEY (modified_by) REFERENCES profiles(id)
    "entities_owner_id_foreign" FOREIGN KEY (owner_id) REFERENCES profiles(id)
Referenced by:
    TABLE "actions" CONSTRAINT "actions_entity_ref_foreign" FOREIGN KEY (entity_ref) REFERENCES entities(id)
    TABLE "entities" CONSTRAINT "entities_entity_ref_foreign" FOREIGN KEY (entity_ref) REFERENCES entities(id)
```

## Actions

```
                                                         Table "public.actions"
     Column     |          Type          |                      Modifiers                       | Storage  | Stats target | Description
----------------+------------------------+------------------------------------------------------+----------+--------------+-------------
 id             | integer                | not null default nextval('actions_id_seq'::regclass) | plain    |              |
 created_epoch  | integer                | not null default date_part('epoch'::text, now())     | plain    |              |
 modified_epoch | integer                |                                                      | plain    |              |
 deleted_epoch  | integer                |                                                      | plain    |              |
 modified_by    | integer                |                                                      | plain    |              |
 deleted_by     | integer                |                                                      | plain    |              |
 community_id   | integer                | not null                                             | plain    |              |
 owner_id       | integer                | not null                                             | plain    |              |
 start_epoch    | integer                |                                                      | plain    |              |
 end_epoch      | integer                |                                                      | plain    |              |
 entity_ref     | integer                |                                                      | plain    |              |
 profile_ref    | integer                |                                                      | plain    |              |
 type           | character varying(255) | not null                                             | extended |              |
 attributes     | json                   | not null default '{}'::json                          | extended |              |
Indexes:
    "actions_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "actions_community_id_foreign" FOREIGN KEY (community_id) REFERENCES communities(id)
    "actions_deleted_by_foreign" FOREIGN KEY (deleted_by) REFERENCES profiles(id)
    "actions_entity_ref_foreign" FOREIGN KEY (entity_ref) REFERENCES entities(id)
    "actions_modified_by_foreign" FOREIGN KEY (modified_by) REFERENCES profiles(id)
    "actions_owner_id_foreign" FOREIGN KEY (owner_id) REFERENCES profiles(id)
    "actions_profile_ref_foreign" FOREIGN KEY (profile_ref) REFERENCES profiles(id)
```
