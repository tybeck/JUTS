#!/bin/bash

# @author Tyler Beck
# @version 0.0.2
# @desc Put's together information needed to run our automated testing / development server(s). This 
# script will grab all java properties within our primary automation cartridge.  Everything will then
# be outputted to stdout as a javascript object notation.

DIR="../source/$1/staticfiles/cartridge/config/";
LOC=$2/;
LASTADDED="";

printf "{ \"config\": {";
pushd ${LOC}/../ >> /dev/null;
printf "\"pwd\": \"$(pwd)\",";
popd >> /dev/null;

pushd $LOC >> /dev/null;
pushd $DIR >> /dev/null;

HASFOUND=true;
COUNT=0;

for f in *; do

if [[ "$f" == *.properties ]]; then

	COUNT=$((COUNT+1));

	if $HASFOUND; then
	    
	    LASTADDED="}}";
	    printf "\"properties\": {";

	fi

	if [[ $COUNT -ge 2 ]];
	    then
		printf ",";
	fi

	cat $f | awk -f ${LOC}/lib/scripts/awk/parser.awk
	
	HASFOUND=false;

fi

done

IFS='/' read -a array <<< "$LOC"
patharr=(${LOC//\// });
devpath=(${patharr[0]//./ });
printf "}, \"devnumber\": ${devpath[1]}";

popd >> /dev/null;

# Check if our application server is running for the development instance we are within.

/sbin/service eserver${devpath[1]}-ase status | grep "running" > /dev/null && printf ", \"running\": true";

# Check for modification's to the application server.

svn st ${LOC} -u --username=v11refstoreteam --password=v11refstoreteam | grep '*' > /dev/null && echo ", \"modifications\": true";

if [ ! $LASTADDED == "" ]; then

	printf $LASTADDED;
	LASTADDED="";

fi