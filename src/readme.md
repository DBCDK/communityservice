# Development

To setup the system locally, in the `src` directory:

    $ touch current.env     // Use default configuration.
    $ npm install           // Install dependencies.

To run the system locally:

    $ docker-compose up -d  // Start local PostgreSQL database on port 5432.
    $ npm run dev           // Start the service.

If you want to manually start up a PostgreSQL server, it needs to run on port 5432 and have a database called `communityservice` owned by `communityservice`; see the following section about environments.

To run fast tests on local machine:

    $ npm run lint-js       // Run ESLint on Javascript.
    $ npm run test-units    // Run unit tests.
    $ npm test              // Run both lint & unit tests.

To run full integration test:

    $ docker-compose up -d  // Start local PostgreSQL database.
    $ npm run test-full     // Run all test, including database integration.

See also [service endpoints](../doc/endpoints.md).

## Database

To start up a local database:

    $ docker-compose up -d  // Start local PostgreSQL database.

To connect to the database:

    $ docker exec -it -u postgres communityservice_database_1 psql

To add a new table in the database, add a new table name to [`constants.js`](server/constants.js), add file to [`migrations/`](migrations/) where the new table is created/destroyed, and incorporate the new table table in [`cleanup-db.js`](acceptance/cleanup-db.js) so that the test will know how to clear the database.

To manually migrate the database:

    $ npm run db-migrate

To run the database testsm you will need a PostgreSQL database server to run the service.

On MacOS, install [Postgres.app](http://postgresapp.com/) and put the following in a file `/etc/paths.d/postgresqlapp`:

    /Applications/Postgres.app/Contents/Versions/latest/bin

You can populate a database with a large test community by running

    $ node generate-test-db.js

when the service is up and running, but beware that this will drop all existing data from the `elvis` database.

The generated test database can be stored for later use by

    $ pg_dump --no-owner --exclude-table='knex_migrations*' elvis > fixtures/big.sql

and reinstated by

    $ psql elvis < fixtures/big.sql

which is exactly what is done to test the complex queries in

    $ npm run test-acceptance

After a new test database has been generated, you will need to update the hard-coded epoch in [query.js](server/v2/query.js) to approximately the [current epoch](https://www.epochconverter.com/).  Also, you will need your `current.env` to include `export FIX_TIME_FOR_TESTING=1`, otherwise the test *should accept criteria for recent events* will fail.

## Coverage

Use `npm run coverage --silent` to produce a code-coverage report, which will end up in `coverage/lcov-report/index.html`.

On the build server, the [config file](../.travis.yml) uses the `after_script` to instruct Travis to send coverage data to Coveralls, which has been configured (through its UI) to look in this `src` directory for the code.

##  Directory structure

The web service is located in `server` and all other local (but possibly reusable) utilities and libraries are located in `lib`.  The script [`setup-node-env.sh`](setup-node-env.sh), which is run as a result of `npm install`, ensures that there are symbolic links `node_modules/server` and `node_modules/__` pointing to `server` and `lib` respectively, so that any part of the server or the local libraries can include any other part by using

```javascript
const mySpiff = require('__/mySpiffyLib');
const config = require('server/config.js');
```

Each directory can have a `readme.md` file that further explains the contents of that particular directory.

## Naming conventions

Functions returning [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) are named with an initial verb in present participle, like `validatingInput` to signify that the operation is taken place immediately but will possibly span some time.

