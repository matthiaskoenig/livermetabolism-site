#!/usr/bin/env bash
# Self-hosted deployment: pull, build the site in a container, (re)start nginx.
set -euo pipefail
cd "$(dirname "$0")"

# latest changes
git pull --ff-only

# Tear down the running site and any leftover containers - including
# orphans left by a previous build step or an interrupted deploy - so
# no old container can collide on name with the ones about to be
# (re)created below.
docker compose down --remove-orphans

# Build the site into dist/ (owned by the current user, see the compose file).
export HOST_UID="$(id -u)" HOST_GID="$(id -g)"
# the build container has no git, so pass the deployed commit in (footer).
export SITE_COMMIT="$(git rev-parse HEAD)"
# `run --rm` (not `up`) so the build container
# is removed as soon as it exits; -T disables TTY allocation so this also
# works when run non-interactively (cron, ssh without -t).
docker compose -f docker-compose-build.yml run --rm -T site

# start nginx serving dist/
docker compose up -d --remove-orphans
