#!/usr/bin/bash

rg "<[/]?code-line>|<[/]?code-pre.*>" -l | xargs -d '\n' sed -i 's/<[\/]\?code-line>//g; s/<[\/]\?code-pre[^>]*>//g'
