#!/bin/bash -e

log_() { echo "[elvis] $@"; }

log_ "--> Installing node packages needed for production"
npm install --production
