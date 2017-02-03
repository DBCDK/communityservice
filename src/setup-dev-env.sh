#!/bin/bash -e

log_() { echo "[elvis] $@"; }

log_ "--> Installing node 6.x"
. ./nvm.sh
nvm install

log_ "--> Installing node packages needed for development"
npm install
