@echo off

::
::  Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)
::
::  This program is free software: you can redistribute it and/or modify
::  it under the terms of the GNU General Public License as published by
::  the Free Software Foundation, either version 3 of the License, or
::  (at your option) any later version.
::
::  This program is distributed in the hope that it will be useful,
::  but WITHOUT ANY WARRANTY; without even the implied warranty of
::  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
::  GNU General Public License for more details.
::
::  You should have received a copy of the GNU General Public License
::  along with this program.  If not, see <https://www.gnu.org/licenses/>.
::
::  https://github.com/alexemanuelol/rustplusplus
::

git checkout -- package-lock.json

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