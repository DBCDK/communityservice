[![Build Status](https://travis-ci.org/DBCDK/communityservice.svg?branch=master)](https://travis-ci.org/DBCDK/communityservice)
[![Coverage Status](https://coveralls.io/repos/github/DBCDK/communityservice/badge.svg?branch=master)](https://coveralls.io/github/DBCDK/communityservice?branch=master)
[![bitHound Overall Score](https://www.bithound.io/github/DBCDK/communityservice/badges/score.svg)](https://www.bithound.io/github/DBCDK/communityservice)

# DBC Community Service

For a bird eye's view, see the [product vision](doc/product-vision.md) and the software architecture [context](doc/dbc-community-service-context.pdf) and [containers](doc/dbc-community-service-containers.pdf).

## Releases

Releases are found at GitHub [/releases](https://github.com/DBCDK/communityservice/releases).

## Deployment

To run the unit tests against the server:

    $ cd src
    $ . /nvm.sh
    $ nvm install
    $ npm install
    $ cp environments/developer.env current.env
    $ npm test

To run the database tests against the server (requires postgresql):

    $ cd src
    $ . /nvm.sh
    $ nvm install
    $ npm install
    $ cp environments/travis.env current.env
    $ npm run dbtest --silent

To start the server in staging or production mode:

    $ cd src
    $ . /nvm.sh
    $ nvm install
    $ npm install --production
    $ cp environments/production.env current.env
    $ npm run serve

You can edit `current.env` after the above steps to further control the settings.  The web service obeys the following environment variables.

| Environment variable    | Default     | Effect                           |
| ----------------------- | ----------- | -------------------------------- |
| DB_CONNECTIONS_POOL_MAX | 10          | Maximum connections in DB pool   |
| DB_CONNECTIONS_POOL_MIN | 2           | Minimum connections in DB pool   |
| DB_HOST                 | 127.0.0.1   | Database host                    |
| DB_NAME                 | elvis       | Name of the database             |
| DB_USER                 |             | Database user                    |
| DB_USER_PASSWORD        |             | Database password                |
| FIX_TIME_FOR_TESTING    | 0           | Pretend now is always a fixed value (1), or ask DB what time it is (0) |
| LOG_LEVEL               | INFO        | Verbosity of service log (OFF, ERROR, WARN, WARNING, INFO, DEBUG, TRACE) |
| LOG_SERVICE_ERRORS      | 1           | Record all 5xx errors (1), or ignore errors (0) |
| NODE_ENV                | development | Controls other service settings  |
| PORT                    | 3000        | TCP port for the service         |
| PRETTY_LOG              | 1           | Pretty printed log statements (1), or one-line log statements (0) |

The web service has the following administrative endpoints:

| Endpoint  | Function |
| --------- | -------- |
| `/status` | Returns the service status as JSON |
| `/pid`    | Returns the service's process id   |


## Project management

See [Trello board](https://trello.com/b/cwxvuEYY/elvis).

## Data formats

See the [endpoints](doc/endpoints.md), [query language](doc/query-language.md), [database model](doc/db-model.md) and various [notes](doc/NOTES.md).

## Development

You can run and test the service directly from the `src` directory or you can use a virtual machine to get a controlled environment that resembles the production environment.  Regardless of whether or not you [use the VM](vm.md), the [developer instructions](src/readme.md) are in the `src` directory.
