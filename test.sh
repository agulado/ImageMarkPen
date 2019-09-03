#!/bin/bash
echo
echo "--------- START ----------"

branch=$GIT_BRANCH
working_copy=$WORKSPACE

stage="hahaha"
if [ "$branch" == "origin/master" ]
then
    stage="test"
elif [ "$branch" == "origin/staging" ]
then
    stage="staging"
elif [ "$branch" == "origin/release" ]
then
    stage="release"
else
    stage="test"
fi

echo
echo "stage=$stage"

echo
echo git diff $GIT_COMMIT $GIT_PREVIOUS_COMMIT --name-only