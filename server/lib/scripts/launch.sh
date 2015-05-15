#!/bin/bash

# Launches our development environment using information from
# our shortcut's that are automatically setup when installed.
# @author Tyler Beck
# @version 0.0.1

clear
pushd $1/ > /dev/null
source $HOME/.bashrc

if [[ $2 == "true" ]]; then
		if [[ $3 == "true" ]]; then
				node $1/server.js -o -s
			else
				node $1/server.js -o
		fi
	else
		if [[ $3 == "true" ]]; then
				node $1/server.js -s
			else
				node $1/server.js
		fi
fi

echo ""
read -p "Press enter to exit..."