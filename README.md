[![NSP Status](https://nodesecurity.io/orgs/dbcdk/projects/cade0663-ab94-4a02-808a-927f75ed1430/badge)](https://nodesecurity.io/orgs/dbcdk/projects/cade0663-ab94-4a02-808a-927f75ed1430)
[![David](https://img.shields.io/david/DBCDK/communityservice.svg?style=flat-square)](https://david-dm.org/DBCDK/communityservice#info=dependencies)
[![David](https://img.shields.io/david/dev/DBCDK/communityservice.svg?style=flat-square)](https://david-dm.org/DBCDK/communityservice#info=dev)
[![bitHound Overall Score](https://www.bithound.io/github/DBCDK/communityservice/badges/score.svg)](https://www.bithound.io/github/DBCDK/communityservice)
[![Build Status](https://travis-ci.org/DBCDK/communityservice.svg?branch=master)](https://travis-ci.org/DBCDK/communityservice)

# communityservice
The mighy community service

##Releases
Releases are found at GitHub [/releases](https://github.com/DBCDK/communityservice/releases). Each containing a link to the changelog for the given release. A consolidated changelog for all releases is found at [CHANGELOG.md](https://github.com/DBCDK/communityservice/blob/master/CHANGELOG.md) in the project root.  
The changelog is made with [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator) and can be created with the command `github_changelog_generator -u DBCDK -p communityservice --exclude-tags-regex "(jenkins-|\d\.\d\d{1,})"` -- you may need a valid github token to run the command.

##Start
###Development
After cloning the repository, run `npm install` to install dependencies. Copy env.test to env.env and set the environment variables (see below) to you need/liking. The application is started with `npm run dev`, which include [nodemon](https://www.npmjs.com/package/nodemon) in order to restart the application, when the code is changed.

To use a local database, postgres has to be installed. User, password and database are set through environment variables - see [Migration](https://github.com/DBCDK/communityservice#migration) below.

###Production
You can start the application with `node src/main.js` from the project root after setting the environment variables.

###Migration
To install the latest database changes, run `npm run migrate:latest` to update the database tables. When installing the application, you must run the command to create the needed tables.

For development you use `npm run migrate:latest:dev` to source the env.env file before updating the tables.
 

##Tests

### Unittests
The tests are run by `npm run test` - specifications can be found in `package.json`.  
To test in a CI environment, like Jenkins, the environment variable `JUNIT_REPORT_PATH` must be set, like `JUNIT_REPORT_PATH=/report.xml npm run test`  
Note then `npm run test` sets `LOG_LEVEL=OFF` to disable logging during the tests.  
See [mocha-jenkins-reporter](https://www.npmjs.com/package/mocha-jenkins-reporter)

### Integration tests
Integration tests run with [selenium](http://docs.seleniumhq.org/) are located in selenium/tests and are run with `npm run test:integration`. The tests use [saucelabs](https://saucelabs.com/) and require that the environment variable `SAUCE_USERNAME` og `SAUCE_ACCESS_KEY` are set.  

##Logging
Logging use `stdout` and the levels specified in [environment variables](https://github.com/DBCDK/communityservice#environment-variables) below.

##Environment variables
The variables are specified at the form `name : internal config object`. References in the log from the startup, will use the internal config object.
- `CS_DB_CONNECTIONS_POOL_MAX` : `postgres.pool.max`  
Maximum connections in pool

- `CS_DB_CONNECTIONS_POOL_MIN` : `postgres.pool.min`  
Minimum connections in pool

- `CS_DB_HOST` : `postgres.connection.host`  
Database host

- `CS_DB_NAME` : `postgres.connection.database`  
Name of the CommunityService database

- `CS_DB_USER` : `postgres.connection.user`    
Database user

- `CS_DB_USER_PASSWORD` : `postgres.connection.password`  
CommunityService database password

- `LOG_LEVEL` : `log.level`  
Specifies the log level used by the application. Defaults to `INFO`
Log level constants supported:: `OFF` (0), `ERROR` (1), `WARN` (2), `WARNING` (2), `INFO` (3), `DEBUG` (4), `TRACE` (5)

- `MOCK_SESSION_STORAGE` : `mock_storage.session`  
Set to `1` to use memory storage instead of persistent storage
 
- `NODE_ENV` : `app.env`  
When run in production the `NODE_ENV` should be set to `production`: `NODE_ENV=production`
 
- `OPENAGENCY_URI` : `openAgency.uri`  
The address to the openAgency service

- `PORT` : `app.port`  
Specifies the port to expose the application. Default: `3010`

- `PRETTY_LOG` : `log.pretty`  
Set to `1` (`PRETTY_LOG=1`) for pretty printed log statements. Any other setting, will result in one-line log statements.

- `SAUCE_USERNAME` : `brugernavn`  
Saucelabs user name

- `SAUCE_ACCESS_KEY` : `access key`  
Saucelabs user access key

- `TEST_ENV` : `local`  
Set to `local` to run selenium tests locally. Defaults to `saucelabs`

# Dokumentation
## Endpoints

