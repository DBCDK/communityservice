#!/bin/sh

PSQL=psql
DB=elvis
SEED=fixtures/big.sql

if ! hash $PSQL 2>/dev/null; then
	echo $PSQL not in PATH, aborting.
	exit 1
fi

if ! $PSQL $DB < fixtures/clean-db.sql > /dev/null; then
	echo Could not clean database, aborting.
	exit 2
fi

echo Seeding $DB with $SEED
if ! $PSQL $DB < $SEED > /dev/null; then
	echo Could not seed database, aborting.
	exit 3
fi

exit 0

