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
function dealPath(){
    arr=($*)
    for path in ${arr[@]}
    do
        echo "29" $path
    done
}
if [[ $1 == "dealPath" ]]; then
    echo "29:" $*
    shift
    dealPath $*
    exit 0
fi
git diff $GIT_COMMIT $GIT_PREVIOUS_COMMIT --name-only $1 | xargs $0 dealPath

echo
