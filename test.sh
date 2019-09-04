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

echo "stage=$stage"

echo
diff_files=`git diff $GIT_COMMIT $GIT_PREVIOUS_COMMIT --name-only $1`
echo diff_files

echo
