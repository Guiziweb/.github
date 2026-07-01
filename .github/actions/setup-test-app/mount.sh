#!/usr/bin/env bash
# Mount the plugin's Sylius test application and start a server on :8080.
# Runs in the caller's checkout ($GITHUB_WORKSPACE), already on the right branch.
set -euo pipefail

symfony server:ca:install || true

composer install --no-interaction

( cd vendor/sylius/test-application && yarn install && yarn build )

vendor/bin/console doctrine:database:create -n --if-not-exists
vendor/bin/console doctrine:schema:create -n
vendor/bin/console assets:install
vendor/bin/console cache:warmup
vendor/bin/console sylius:fixtures:load -n

symfony server:start --port=8080 --daemon