#!/bin/sh

## Used for testing the service.

PSQL=psql
SEED=fixtures/big.sql

if ! hash $PSQL 2>/dev/null; then
	echo $PSQL not in PATH, aborting.
	exit 1
fi

echo Seeding $DB_NAME with $SEED...
if ! $PSQL $DB_NAME -U $DB_USER -h $DB_HOST -v ON_ERROR_STOP=1 < $SEED > /dev/null; then
	echo Could not seed database, aborting.
	exit 2
fi

echo Faking Knex migration of $DB_NAME...
NOW=$(date "+%Y-%m-%d %H:%M:%S%z")
SCRIPT=""
for f in migrations/*.js; do
	BASEFILE=${f##*/}
	SQL="insert into knex_migrations (name,batch,migration_time) values ('$BASEFILE',1,'$NOW');"
	SCRIPT=$SCRIPT\\n$SQL
done

if ! echo $SCRIPT | $PSQL $DB_NAME -U $DB_USER -h $DB_HOST -v ON_ERROR_STOP=1 > /dev/null; then
	echo Could not migrate database, aborting.
	exit 3
fi

exit 0
