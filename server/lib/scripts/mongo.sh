#!/bin/bash

nohup $1bin/mongod --dbpath $1bin/data/db > /dev/null &