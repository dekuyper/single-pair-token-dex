#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the testrpc instance that we started (if we started one and if it's still running).
  if [ -n "$testrpc_pid" ]; then
    kill -9 $testrpc_pid || true
  fi
}

if [ "$SOLIDITY_COVERAGE" = true ]; then
  testrpc_port=8555
else
  testrpc_port=8545
fi

testrpc_running() {
  nc -z localhost "$testrpc_port"
}

start_testrpc() {
  local accounts=(
    --account="0xcb8e86cdf1ae166a459499ae76476bd96a699ff56176855c3c848faa49419703,1000000000000000000000000" `# owner account`
    --account="0x84382b0008015ef21871622efdfadcd14f15eef6d5e6eab552821afc1fee9832,1000000000000000000000000" `# trader1 account`
    --account="0x86542fb58ff2c152006f6a32ce58317aba7b9c590f6c5cae38bfb0c50ec4a32d,1000000000000000000000000" `# trader2 account`
    --account="0xf2b51bae6068e05631a854fb22dfb4c03d6d6c4d5a9b194a102dc9369b84b7e5,1000000000000000000000000" `# trader3 account`
    --unlock 0
    --unlock 1
    --unlock 2
    --unlock 3
  )

  if [ "$SOLIDITY_COVERAGE" = true ]; then
    echo "Starting solidity coverage testrpc"
    node_modules/.bin/testrpc-sc --gasLimit 0xfffffffffff --port "$testrpc_port" "${accounts[@]}" > /dev/null &
  else
    echo "Starting testrpc"
    node_modules/.bin/testrpc --gasLimit 0xfffffffffff "${accounts[@]}" > /dev/null &
  fi

  testrpc_pid=$!
}

if testrpc_running; then
  echo "Using existing testrpc instance"
else
  echo "Starting our own testrpc instance"
  start_testrpc
fi

if [ "$SOLIDITY_COVERAGE" = true ]; then
  node_modules/.bin/solidity-coverage

  # if [ "$CONTINUOUS_INTEGRATION" = true ]; then
  #   cat coverage/lcov.info | node_modules/.bin/coveralls
  # fi
else
  node_modules/.bin/truffle test "$@"
fi
