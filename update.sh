#!/bin/bash

git stash
if [ $? -ne 0 ]; then
    echo "Could not successfully stash current changes"
    exit 1
fi

git pull --rebase origin master
if [ $? -ne 0 ]; then
    echo "Could not successfully pull the latest changes to your local repository"
    exit 1
fi

git stash pop
if [ $? -ne 0 ]; then
    echo "Could not successfully pop the stash"
    exit 1
fi
