#!/bin/bash
########################
####
####    Installation script for JavaScript Unit Testing Suite
####    Author: Alberto Navarro / Tyler Beck
####    Version: 0.0.46
####
########################

export VERSION='0.0.46';
export ESERVER=/opt/intershop/; # where our eserver's reside
export NODE_VERSION=v0.10.22; # which node version we will be installing

export ESERVERCOUNT=0; # number of eservers
export WEBSTORECOUNT=0; # number of webstores

export REFUSER='v11refstoreteam'
export REFPASS='v11refstoreteam'

clear # Clear our terminal screen 

echo "########################################################"
echo "###"
echo "$(tput setaf 6)###   Installing JUTS v$VERSION"
echo "###   Company: eBay Enterprise"
echo "###   Author: Tyler Beck"
echo "$(tput sgr0)###"
echo "########################################################"
echo "###"
echo "$(tput setaf 6)###   Please select which eserver you want to install JUTS on"
echo "###   Instructions: Please enter the corresponding number and then press 'enter'."
echo "$(tput sgr0)###"
echo "########################################################"
echo ""

for fd in ${ESERVER}*; do
    
    if [ -d "$fd" ]; then

        echo "$[ESERVERCOUNT+1].) $fd"
        
        ESERVERCOUNT=$[ESERVERCOUNT+1];

    fi
    
done

echo ""

while true; do
  
  read -p "Please choose an (e)server: " server_input
  
  case $server_input in
  
      ''|*[!0-9]*) echo "Incorrect data, please use numeric values only."; ;;
      *) break;;
      
  esac

done

clear
echo "########################################################"
echo "###"
echo "$(tput setaf 6)###   JUTS: Downloading Dependencies..."
echo "$(tput sgr0)###"
echo "########################################################"
sleep 2

if ! hash "nvm" >/dev/null 2>&1; then
    echo "Installing NVM %s\n" >&2
    curl https://raw.github.com/creationix/nvm/master/install-gitless.sh | sh;
fi
wait

source $HOME/.bash_profile;
cd $HOME;
nvm install $NODE_VERSION;

wait
echo "########################################################"
echo "###"
echo "$(tput setaf 6)###   JUTS: Node Installation Complete..."
echo "$(tput sgr0)###"
echo "########################################################"

source $HOME/.bash_profile;
npm install -g phantomjs;

wait
echo "########################################################"
echo "###"
echo "$(tput setaf 6)###   JUTS: PhantomJS Installation Complete..."
echo "$(tput sgr0)###"
echo "########################################################"
echo ""

commands_tocheck="nvm phantomjs"
missing_counter=0;

for needed_command in $commands_tocheck; do
  if ! hash "$needed_command" >/dev/null 2>&1; then
    echo "Command not found in PATH: %s\n" "$needed_command" >&2
    ((missing_counter++))
  fi
done

if ((missing_counter > 0)); then
  echo "There was something wrong with the installation. Please contact the Storefront Team" >&2
  exit 1
fi

if [ -d "$HOME/.nvm/$NODE_VERSION/bin" ]; then

  echo "PATH=\$PATH:\$HOME/.nvm/$NODE_VERSION/bin" >> "$HOME/.bashrc";
  echo "alias jutstest$server_input=\"clear && node /development.$server_input/v11ext/juts/server/server.js\"" >> "$HOME/.bashrc";
  wait && source $HOME/.bashrc

  sudo node_path="$HOME/.nvm/$NODE_VERSION/bin" sh -c 'echo "PATH=\$PATH:$node_path" >> "$HOME/.bashrc"';
  sudo server_input="$server_input" sh -c 'echo "alias juts_server$server_input=\"clear && node /development.$server_input/v11ext/juts/server/server.js -w\"" >> "$HOME/.bashrc"';
  sudo sh -c 'source $HOME/.bashrc'

fi

cd /development.$server_input/v11ext/;

if [[ ! -d "juts" ]]; then
    mkdir juts && cd juts
    if [[ -d "webstores" ]]; then
      mkdir webstores
    fi
  else
    cd juts
fi

svn co "http://devsvn.gspt.net/svn/components/sandbox/js/server" --no-auth-cache --non-interactive --username=$REFUSER --password=$REFPASS
wait && clear

clear && node /development.$server_input/v11ext/juts/server/server.js setup