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

    arr=$1
    _arr=(${arr//\// })
    directory=""
    for i in ${!_arr[@]}
    do
        if [[ $i < $[ ${#_arr[@]}-1 ] ]]; then
            directory+="${_arr[i]}/"
        fi
    done

    echo $directory
}

function dealPath(){

    echo
    echo "--------- STAGE: $stage ---------"
    echo "--------- COMMIT FILE_PATHS ----------"

    arr=($*)
    directory_level=0
    compile_arr=()
    ext_js=("js")
    ext_css=("css")
    ext_img=("png","jpg","gif","svg")
    ext_view=("html")
    for path in ${arr[@]}
    do
        echo
        echo "41 path=" $path

        ext_arr=(${path//./ })

        echo "56"
        ${ext_view[@]} | grep -iw ${ext_arr[$[ ${#ext_arr[@]}-1 ]]} | xargs
        echo

        _arr=(${path//\// })

        echo "55 _arr.length=" ${#_arr[@]}

        if [ ${#_arr[@]} \< $directory_level -o $directory_level == 0 ]; then
            directory_level=${#_arr[@]}
            compile_dir=$(combineDir "$path")
            echo "59: compile_dir=" ${compile_dir}
            compile_arr=($compile_dir)
        fi

        echo "62: compile_arr=" ${compile_arr[@]}

    done
}
if [[ $1 == "dealPath" ]]; then
    shift
    dealPath $*
    exit 0
fi
git diff $GIT_COMMIT $GIT_PREVIOUS_COMMIT --name-only $1 | xargs $0 dealPath

echo
