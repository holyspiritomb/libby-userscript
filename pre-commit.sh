#!/bin/sh

cat goodreads-libby.user.js | sed "s/@grant         GM_addStyle/@grant         GM_addStyle\n\/\/ @grant         unsafeWindow/;s/main\/goodreads-libby.user.js/main\/goodreads-libby-adguard.user.js/" > goodreads-libby-adguard.user.js

git add goodreads-libby-adguard.user.js
