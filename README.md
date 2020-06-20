# aerocoat

Aerocoat.com website 

![Status](https://travis-ci.org/brophdawg11/aerocoat.com.svg?branch=master "Status")

### Adding a new product
* Open SourceTree
  * Click `Pull` in the header to make sure you have the latest copy
* Open the proper `.csv` file(s)
  * Add a new product row(s) in the appropriate groupings
  * `File` | `Save As...``
    * Choose `Windows Comma Separated (csv)`` file
    * Replace the existing file
* Go back to SourceTree
  * Choose the `Uncommitted changes` entry
  * Confirm that your new row(s) show in green for your `.csv` file(s)
  * Click the checkbox next to each edited `.csv` file you want to upload from the `Unstaged files` listing
  * They should move up into the `Staged files` listing
  * Click `Commit`
  * Enter a description of the change and click `Commit`
  * Click `Push`
  * Make sure only `master` is checked and proceed
* The new product should be visible on the website within a few minutes

### PI/MSDS Files
* Live in `aerocoat.com/punch/templates`

## Development Notes

* Built using the [Punch](https://laktek.github.io/punch/) static site generator
* All product info is in the files in the `csv/` folder
* The `punch/scripts/gen-json.js` script handles parsing the CSV files and generating the JSON data files in `punch/contents/_shared/ `.  See the `npm run csv` script for details on different usages for the 3 different product pages
* `npm run generate` builds the final static site in the `output/` folder

To build:

```
cd punch
npm install
npm run csv
npm run generate
```


## Hosting/Deployment notes

The site is hosted via [Github Pages](https://pages.github.com/) using the `gh-pages` branch of the repository and configured with the custom `aerocoat.com` domain.  

Continuous Deployment is configured via [Travis CI](https://travis-ci.org/) so that all commits pushed to the `master` branch in Github will trigger an automatic build and deployment.  This is configured via the `.travis.yml` file, and runs the `./scripts/deploy.sh` script to build and deploy the new version of the site.  It does so by checking out the `gh-pages` branch, building the site, and committing the latest `output/` folder to the `gh-pages branch`.  Github access is managed via private environment variables configured in Travis CI (vi the `ENCRYPTION_LABEL` value in `.travis.yml`).




