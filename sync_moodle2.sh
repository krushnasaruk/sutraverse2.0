#!/bin/bash
commits=$(git rev-list --reverse c9f7a9f270f982ad008a6bc9fcc43c856a9e0d1c..main | tr -d '\r')
is_first=true
for commit in $commits; do
    if [ "$is_first" = true ]; then
        echo "Initializing moodle2 with force push of first commit: $commit..."
        git push -f moodle2 $commit:refs/heads/main
        is_first=false
    else
        echo "Pushing $commit..."
        git push moodle2 $commit:refs/heads/main
    fi
done
echo "Done syncing moodle2!"
