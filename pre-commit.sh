#!/bin/sh

cat libby-availability.user.js | sed "s/@grant         GM_addStyle/@grant         GM_addStyle\n\/\/ @grant         unsafeWindow/;s/main\/libby-availability.user.js/main\/libby-availability-adguard.user.js/" > libby-availability-adguard.user.js

git add libby-availability-adguard.user.js
