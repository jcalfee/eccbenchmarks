### Eosio bash session environment for this project

## Usage: source docker/eosio.sh

this_dir="$(dirname $(realpath $BASH_SOURCE))"
yaml="$this_dir/docker-compose.yml"

# Runs docker-compose from any directory
function eosio-docker() {
  echo ++ docker-compose -f "$yaml" "$@"
  docker-compose -f "$yaml" "$@"
}

function eosio-tail() {
  docker-compose -f "$yaml"\
  logs -f 2>&1 | egrep -v 'Produced block 0'
}

function eosio-unlock() {
  docker-compose -f "$yaml" exec keosd\
  cleos wallet unlock --password $(cat "${this_dir}/.wallet-password.txt")
}

function eosiocpp() {
  docker-compose -f "$yaml" exec keosd eosiocpp "$@"
}

function cleos() {
  docker-compose -f "$yaml" exec keosd\
  cleos -u http://nodeosd:8888 --wallet-url http://localhost:8900 "$@"
}

function keosd() { docker-compose -f "$yaml" exec keosd "$@"; }
function nodeosd() { docker-compose -f "$yaml" exec keosd nodeosd "$@"; }
