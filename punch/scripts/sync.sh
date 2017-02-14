#!/bin/bash

if [ $(basename $(pwd)) != "output" ]; then
  echo "Must run from the output/ directory";
  exit;
fi

aws --profile aerocoat s3 sync . s3://www.aerocoat.com/ --exclude "*Suppliers*" --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers
