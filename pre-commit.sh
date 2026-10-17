#!/bin/sh

VERSION=`grep "version" libby-availability.user.js | awk -F ' ' '{print $3}'`
jq -r --arg VER "$VERSION" '.version = $VER' package.json

cat libby-availability.user.js | sed "s/main\/libby-availability.user.js/main\/libby-availability-adguard.user.js/" > libby-availability-adguard.user.js

# git add libby-availability-adguard.user.js
