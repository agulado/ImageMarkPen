#!/bin/bash
branch=$GIT_BRANCH
working_copy=$WORKSPACE

stage="test"
if ["$branch"="origin/master"]
    stage="test"
elif["$branch"="origin/staging"]
    stage="staging"
elif["$branch")="origin/release"]
    stage="release"
fi

echo $stage
echo "test.sh hehe $working_copy"