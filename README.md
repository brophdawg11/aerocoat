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
