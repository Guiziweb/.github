#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-app}"

composer install --no-interaction

if [ "$MODE" = "deps" ]; then
    echo "deps mounted (composer only)"
    exit 0
fi

symfony server:ca:install || true

( cd vendor/sylius/test-application && yarn install && yarn build )

vendor/bin/console doctrine:database:create -n --if-not-exists
vendor/bin/console doctrine:schema:create -n
vendor/bin/console assets:install
vendor/bin/console cache:warmup
vendor/bin/console sylius:fixtures:load -n

symfony server:start --port=8080 --daemon

curl -ksf --retry 10 --retry-delay 2 --retry-all-errors -o /dev/null https://127.0.0.1:8080
echo "app mounted and serving on https://127.0.0.1:8080"