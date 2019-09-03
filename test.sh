#!/bin/bash
branch=$GIT_BRANCH
working_copy=$WORKSPACE

stage="test"
if("$branch"="origin/master")
    stage="test"
else if("$branch"="origin/staging")
    stage="stage"
else if("$branch")="origin/release")
    stage="release"
fi

echo $stage
echo "test.sh hehe $working_copy"