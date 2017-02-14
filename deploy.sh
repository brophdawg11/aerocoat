#!/bin/bash

set -e # Exit with nonzero exit code if anything fails
set -x

SOURCE_BRANCH="master"
TARGET_BRANCH="gh-pages"
OUTPUT_DIR="output"

# Pull requests and commits to other branches shouldn't try to deploy, just build to verify
if [ "$TRAVIS_PULL_REQUEST" != "false" -o "$TRAVIS_BRANCH" != "$SOURCE_BRANCH" ]; then
    echo "Skipping deploy; just doing a build."
    doCompile
    exit 0
fi

# Save some useful information
REPO=`git config remote.origin.url`
SSH_REPO=${REPO/https:\/\/github.com\//git@github.com:}
SHA=`git rev-parse --verify HEAD`

# Clone the existing gh-pages for this repo into output/
# Create a new empty branch if gh-pages doesn't exist yet (should only happen on first deply)
git clone $REPO $OUTPUT_DIR
cd $OUTPUT_DIR
git checkout $TARGET_BRANCH || git checkout --orphan $TARGET_BRANCH
cd ..

# Clean out existing contents
rm -rf $OUTPUT_DIR/**/* || exit 0

# Run our build script
./build.sh

# Now let's go have some fun with the cloned repo
cd $OUTPUT_DIR
git config user.name "Travis CI"
git config user.email "$COMMIT_AUTHOR_EMAIL"

# If there are no changes to the compiled out (e.g. this is a README update) then just bail.
if [ $(git status --porcelain | wc -l) -lt 1 ]; then
    echo "No changes to the output on this push; exiting."
    exit 0
fi

# Commit the "changes", i.e. the new version.
# The delta will show diffs between new and old versions.
git add .
git commit -m "Deploy to GitHub Pages: ${SHA}"

# Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
openssl aes-256-cbc -K $encrypted_3085f9acb42e_key -iv $encrypted_3085f9acb42e_iv -in ../travis-aerocoat.enc -out travis-aerocoat -d
chmod 600 travis-aerocoat
eval `ssh-agent -s`
ssh-add travis-aerocoat

# Now that we're all set up, we can push.
git push $SSH_REPO $TARGET_BRANCH

set +x

