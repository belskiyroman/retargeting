nvmrc='.nvmrc'
node_version=`cat .nvmrc`
nvm_path=`. ~/.nvm/nvm.sh; command -v nvm`
list_node_version=`. ~/.nvm/nvm.sh; nvm ls $node_version`
#path_to_node=`nvm which $node_version | tail -n 1`



if echo $nvm_path | grep nvm;
then
   echo "nvm installed"
else
echo "nvm install..."
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash
fi


if  echo $list_node_version | grep "N/A"; then
echo "install node $node_version"
. ~/.nvm/nvm.sh; nvm install $node_version
fi

node_path=`. ~/.nvm/nvm.sh; nvm which $node_version`

echo "create .npmrc"
echo "name=retargeting" > .npmrc
echo "node=$node_path" >> .npmrc
npm install