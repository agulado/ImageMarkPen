#!/bin/bash

branch=$GIT_BRANCH
working_copy=$WORKSPACE

ignore_dir=("depends","components")
image_dir=("images")
ext_js=("js")
ext_css=("css")
ext_view=("html")

stage="test"
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

# 组织combine_dir
function combineDir(){

    path=$1
    arr=(${path//\// })
    directory=""
    for i in ${!arr[@]}
    do
        if echo "${ignore_dir[@]}" | grep -iw $path; then
            continue
        fi

        if [[ $i < $[ ${#arr[@]}-1 ] ]]; then
            directory+="${arr[i]}/"
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
        elif echo "$image_dir" | grep -iw $path; then
            file_type="img" 
        else
            # 非指定文件类型则跳过
            continue
        fi  

        eval compile_dir_now=\${compile_arr_$file_type[@]}
        eval compile_arr_length=\${\#compile_arr_$file_type[@]}
        if [[ $compile_arr_length == 1 && $compile_dir_now == "" ]]; then
            continue
        fi

        compile_dir=$(combineDir "$path")
        eval compile_arr=\${compile_arr_$file_type[@]}
        if echo $compile_arr | grep -iw $compile_dir; then
            continue
        fi

        if [[ compile_dir == "" ]]; then
            eval compile_arr_$file_type=\(""\)
        else
            eval compile_arr_$file_type+=\($compile_dir\)
        fi

        eval echo "100: compile_arr_"$file_type"=" \${compile_arr_$file_type[@]}

    done
}
if [[ $1 == "dealPath" ]]; then
    shift
    dealPath $*
    exit 0
fi
git diff $GIT_COMMIT $GIT_PREVIOUS_COMMIT --name-only $1 | xargs $0 dealPath

echo
