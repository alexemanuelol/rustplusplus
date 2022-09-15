@echo off

git stash
if not %errorlevel%==0 (
    echo "Could not successfully stash current changes"
    exit /b 1
)

git pull --rebase origin master
if not %errorlevel%==0 (
    echo "Could not successfully pull the latest changes to your local repository"
    exit /b 1
)

git stash pop
if not %errorlevel%==0 (
    echo "Could not successfully pop the stash"
    exit /b 1
)

npm install
if not %errorlevel%==0 (
    echo "Could not successfully install packages"
    exit /b 1
)