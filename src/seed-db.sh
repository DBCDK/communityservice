#!/bin/sh

PSQL=psql
SEED=fixtures/big.sql

if ! hash $PSQL 2>/dev/null; then
	echo $PSQL not in PATH, aborting.
	exit 1
fi

if ! $PSQL $DB_NAME < fixtures/clean-db.sql > /dev/null; then
	echo Could not clean database, aborting.
	exit 2
fi

echo Seeding $DB_NAME with $SEED
if ! $PSQL $DB_NAME < $SEED > /dev/null; then
	echo Could not seed database, aborting.
	exit 3
fi

exit 0

