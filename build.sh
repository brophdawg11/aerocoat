#!/bin/bash

set -e  ## Exit if anything goes wrong
set -x  ## Print commands to stdout

if [ ! -d "output" ]; then
    mkdir output
fi

cp index.html output/

set +x  ## Stop printing commands to stdout
