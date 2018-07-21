@echo off
set path=..\npm-global;%path%
ng serve -pc proxy.conf.json -o
