#!/bin/bash

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

function dealPath(){

    echo
    echo "--------- STAGE: $stage ---------"
    echo "--------- COMMIT FILE_PATHS ----------"

    arr=($*)
    for path in ${arr[@]}
    do
        echo $path

        _arr=(${path//\// })
        indent="-- "
        for _path in ${_arr[@]}
        do
            echo indent $_path
        done
    done
}
if [[ $1 == "dealPath" ]]; then
    shift
    dealPath $*
    exit 0
fi
git diff $GIT_COMMIT $GIT_PREVIOUS_COMMIT --name-only $1 | xargs $0 dealPath

echo
