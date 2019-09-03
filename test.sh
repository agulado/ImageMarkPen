#!/bin/bash
branch=$GIT_BRANCH
working_copy=$WORKSPACE

stage="test"
if [$branch="origin/master"] 
then
    stage="test"
elif [$branch="origin/staging"] 
then
    stage="staging"
elif [$branch)="origin/release"] 
then
    stage="release"
fi

echo $stage
echo "test.sh hehe $working_copy"