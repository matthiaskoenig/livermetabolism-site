#!/usr/bin/env bash
set -euo pipefail

# latest changes
git pull

# Tear down the running site and any leftover containers - including
# orphans left by a previous build step or an interrupted deploy - so
# no old container can collide on name with the ones about to be
# (re)created below.
docker compose down --remove-orphans

# Build web content. `run --rm` (not `up`) so the build container is
# removed as soon as it exits instead of lingering around afterward
# under a fixed name for the next deploy to collide with; -T disables
# TTY allocation so this also works when run non-interactively.
docker compose -f docker-compose-build.yml run --rm -T jekyll

# start nginx service
docker compose up --build -d --remove-orphans
