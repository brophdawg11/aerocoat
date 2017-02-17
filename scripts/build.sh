#!/bin/bash

set -e  ## Exit if anything goes wrong
set -x  ## Print commands to stdout

cd punch
npm install
npm run clean
npm run csv
npm run generate
cd ..

set +x  ## Stop printing commands to stdout
