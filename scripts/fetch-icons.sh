#!/usr/bin/env bash
# Downloads the Font Awesome Free 6 SVGs the site uses into site/icons/,
# named by the Font Awesome 4 class name the templates/data use (tags.yml
# `icon:` values are FA4 names). Re-run when adding an icon.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p site/icons
BASE="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs"
# fa4-name  style/fa6-name
while read -r name src; do
  [ -z "$name" ] && continue
  curl -fsSL "$BASE/$src.svg" -o "site/icons/$name.svg"
  echo "fetched $name <- $src"
done <<'MAP'
cube solid/cube
heartbeat solid/heart-pulse
picture-o regular/image
line-chart solid/chart-line
unlock-alt solid/unlock-keyhole
cogs solid/gears
file-pdf-o regular/file-pdf
code solid/code
user-circle-o regular/circle-user
users solid/users
user solid/user
chevron-down solid/chevron-down
chevron-up solid/chevron-up
globe solid/globe
github brands/github
orcid brands/orcid
desktop solid/desktop
video-camera solid/video
caret-down solid/caret-down
home solid/house
envelope solid/envelope
phone solid/phone
google brands/google
linkedin brands/linkedin
youtube brands/youtube
registered solid/registered
search solid/magnifying-glass
person-chalkboard solid/person-chalkboard
laptop-code solid/laptop-code
book solid/book
file-text-o regular/file-lines
image regular/image
money solid/money-bill
pencil solid/pencil
newspaper-o regular/newspaper
graduation-cap solid/graduation-cap
flask solid/flask
compass regular/compass
file-o regular/file
MAP
cat > site/icons/LICENSE.txt <<'TXT'
The SVG files in this directory are from Font Awesome Free 6
(https://fontawesome.com), licensed CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/). Files were renamed to the
Font Awesome 4 class names used by this site.
TXT
