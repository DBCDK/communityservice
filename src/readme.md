# Development

All development and testing takes place here in the `src` directory.  If you want to take advantage of the virtual-environment setup to separate your local machine from the project, follow the [VM instructions](../vm.md).  Otherwise you have to run `npm install` to install the dependencies.

## Setup

You will need a PostgreSQL database server to run the service.

On MacOS, install [Postgres.app](http://postgresapp.com/) and put the following in a file `/etc/paths.d/postgresqlapp`:

    /Applications/Postgres.app/Contents/Versions/latest/bin

Create a test database:

    $ psql
    # create database elvis;
    # \q

Then copy `environments/developer.env` to `current.env` and modify to match your local setup.
The various settings are [described in the main README](../README.md).

## Service

Use `npm run dev` to start a local server according to the settings in `current.env`.  The server restarts when the source code changes.

## Lint

Use `npm run lint` to run all code through eslint.

## Tests

All files matching the pattern `*_test.js` are considered unit tests, and they will be included automatically when your run `npm run unittest`.  That means that you can (and should) put your unittest next to the files your are testing.

Use `npm test` to run all lints and test.

All files matching the pattern `*_integration.js` are considered integration tests that need a running database, and they will be included automatically when your run `npm run integrationtest`.

## Coverage

Use the `npm run coverage` script to produce a code-coverage report, which will end up in `coverage/lcov-report/index.html`.

On the build server, the [config file](../.travis.yml) uses the `after_script` to instruct Travis to send coverage data to Coveralls, which has been configured through its UI to look in this `src` directory for the code.

##  Directory structure

The web service is located in `server` and all other local (but possibly reusable) utilities and libraries are located in `lib`.  The [setup](setup-node-env.sh), which is run as a result of `npm install`, ensures that there are symbolic links `node_modules/server` and `node_modules/__` pointing to each location respectively, so that any part of the server or the local libraries can include any other part by using

```javascript
const mySpiff = require('__/mySpiffyLib');
const config = require('server/config.js');
```
