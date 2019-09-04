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

function combineDir(){

    echo 22 $1

    return $1

    # _arr=(${$1//\// })
    # directory="/"
    # for i in ${!_arr[@]}
    # do
    #     echo "28" $i
    # done
    # # directory+="/"

    # return $directory
}

function dealPath(){

    echo
    echo "--------- STAGE: $stage ---------"
    echo "--------- COMMIT FILE_PATHS ----------"

    arr=($*)
    directory_level=0
    compile_arr=()
    for path in ${arr[@]}
    do
        echo "41 path=" $path

        _arr=(${path//\// })

        echo "45 _arr.length=" ${#_arr[@]}

        if [ ${#_arr[@]} \< $directory_level -o $directory_level == 0 ];then
            directory_level=${#_arr[@]}
            compile_dir=$(combineDir "$path") 
            compile_arr=($compile_dir)
        fi

        echo "58: compile_arr=" ${compile_arr[@]}

    done
}
if [[ $1 == "dealPath" ]]; then
    shift
    dealPath $*
    exit 0
fi
git diff $GIT_COMMIT $GIT_PREVIOUS_COMMIT --name-only $1 | xargs $0 dealPath

echo
