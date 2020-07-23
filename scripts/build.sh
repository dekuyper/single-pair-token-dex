#!/usr/bin/env bash

set -euxo pipefail

if [ $(./node_modules/.bin/truffle compile --all | tee /dev/stderr | grep -i -c -e "warning\|error") -gt 0 ]; then
    echo "Found errors or warnings in contract compilation. Exiting..."
    exit 1
fi

npm run lint
npm run test
npm run coverage

rm -rf build \
  && ./node_modules/.bin/truffle compile \
  && tar czf build.tar.gz ./build
