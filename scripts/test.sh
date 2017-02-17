#!/bin/bash

## Test that the output directory looks appropriate

echo "Validating the generated site..."

if [ ! -d "./output" ]; then
    echo "ERROR: output/ directory does not exist"
    ls -l .
    exit 1;
else
    echo "  ...output/ exists"
fi

if [ ! -d "./output/All Suppliers -TB and MSDS" ]; then
    echo "ERROR: output/All Suppliers -TB and MSDS/ directory does not exist"
    ls -l output/
    exit 1;
else
    echo "  ...output/All Suppliers -TB and MSDS/ exists"
fi

if [ ! -f "./output/index.html" ] || \
   [ ! -f "./output/company.html" ] || \
   [ ! -f "./output/stocked-products.html" ] || \
   [ ! -f "./output/85285-colors.html" ] || \
   [ ! -f "./output/eclipse-colors.html" ] || \
   [ ! -f "./output/contact-us.html" ] || \
   [ ! -f "./output/search.html" ] || \
   [ ! -f "./output/thank-you.html" ]; then
    echo "ERROR: Incomplete set of .html files"
    ls -l output/
    exit 1;
else
    echo "  ...output/*.html files exist"
fi

echo "Output directory looks valid"
