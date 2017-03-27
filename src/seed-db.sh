#!/bin/sh

## Used for testing the service.

PSQL=psql
SEED=fixtures/big.sql

if ! hash $PSQL 2>/dev/null; then
	echo $PSQL not in PATH, aborting.
	exit 1
fi

echo Seeding $DB_NAME with $SEED...
if ! $PSQL $DB_NAME -v ON_ERROR_STOP=1 < $SEED > /dev/null; then
	echo Could not seed database, aborting.
	exit 3
fi

exit 0
