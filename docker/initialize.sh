set -o errexit

# # Shutdown
# function finish { set +o errexit; }
# trap finish EXIT

this_dir="$(dirname $(realpath $BASH_SOURCE))"
cd "$this_dir"

# docker volumes
docker-compose down -v --remove-orphans
docker volume rm -f nodeos-data-eccbenchmark
docker volume rm -f keosd-data-eccbenchmark

docker volume create --name=nodeos-data-eccbenchmark
docker volume create --name=keosd-data-eccbenchmark

docker-compose up -d
sleep 5

# local environment (./dockrc.sh is the global environment)

## private key (wallet import format)
docker_private_key=${1-5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3}
docker_public_key=${2-EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV}

source ./eosio.sh # cleos command..

set -o xtrace

# wallet
cleos wallet create --to-console | tee /dev/tty |\
  egrep -o "PW[A-Za-z0-9]*" > .wallet-password.txt

cleos wallet import --private-key $docker_private_key

# eosio chain
cleos set contract eosio /contracts/eosio.bios -p eosio@active

cleos create account eosio eosio.token $docker_public_key
cleos set contract eosio.token /contracts/eosio.token -p eosio.token@active

# eccbenchmark
set -o xtrace
cleos create account eosio life $docker_public_key
cleos create account eosio source $docker_public_key

cleos push action eosio.token create\
  '{"issuer":"eosio.token", "maximum_supply": "1000000000.0000 SYS"}' -p eosio.token@active

cleos push action eosio.token issue\
  '{"to":"source", "quantity": "100000.0000 SYS", "memo": "issue"}' -p eosio.token@active
