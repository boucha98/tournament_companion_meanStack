@echo off
IF NOT EXIST db (md db)
..\mongodb\mongod -dbpath db
