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
    compile_arr=()
    ext_js=("js")
    ext_css=("css")
    ext_img=("png","jpg","gif","svg")
    ext_view=("html")
    directory_level_js=0
    directory_level_css=0
    directory_level_img=0
    directory_level_view=0
    compile_arr_js=()
    compile_arr_css=()
    compile_arr_img=()
    compile_arr_view=()
    for path in ${arr[@]}
    do
        echo
        echo "58 path=" $path

        # 获得文件类型
        ext_arr=(${path//./ })
        file_type=""
        ext=${ext_arr[$[ ${#ext_arr[@]}-1 ]]}

        if echo "${ext_view[@]}" | grep -iw $ext; then
            file_type="view"
        elif echo "${ext_js[@]}" | grep -iw $ext; then
            file_type="js" 
        elif echo "${ext_css[@]}" | grep -iw $ext; then
            file_type="css" 
        elif echo "${ext_img[@]}" | grep -iw $ext; then
            file_type="img" 
        else
            # 非指定文件类型则跳过
            continue
        fi

        echo $file_type

        _arr=(${path//\// })

        echo "82 _arr.length=" ${#_arr[@]}
        eval directory_level=\$directory_level_$file_type
        echo "84 directory_level"$view_type"=" $directory_level
        
        # case $file_type in
        #     "view")
        #         directory_level=$directory_level_view
        #         ;;
        #     "js")
        #         directory_level=$directory_level_js
        #         ;;
        #     "css")
        #         directory_level=$directory_level_css
        #         ;;
        #     "img")
        #         directory_level=$directory_level_img
        #         ;;
        #     *)
        #         directory_level=0
        #         ;;
        # esac

        if [[ ${#_arr[@]} < $directory_level || $directory_level == 0 ]]; then
            eval directory_level_$file_type=${#_arr[@]}
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
