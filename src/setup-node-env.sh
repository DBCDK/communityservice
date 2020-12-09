#!/bin/sh -e

ME=$(basename $0)

log_() { echo "[$ME] $@"; }

log_ "--> Setting up symbolic links"
cd node_modules
[ -L __ ] || ln -s ../lib __
[ -L acceptance ] || ln -s ../acceptance acceptance
[ -L server ] || ln -s ../server server
cd ..
