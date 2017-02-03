#!/bin/bash -e

log_() { echo "[elvis] $@"; }

log_ "--> Installing node packages needed for development"
npm install
