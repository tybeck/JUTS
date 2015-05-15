#!/bin/bash

pushd $1 > /dev/null;

export suites="";

for f in *; do
	if [ -f $f ]; then
		result=$(cat $f | grep 'id="suiteTable"')
		if [[ "$result" != "" ]]; then
			if [[ "$suites" != "" ]]; then
				suites="$suites,"
			fi
			suites="$suites$f"
		fi
	fi
done

echo $suites;

popd > /dev/null;