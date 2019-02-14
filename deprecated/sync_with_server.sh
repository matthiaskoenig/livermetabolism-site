#!/bin/bash
################################################################################
# Synchronize changes in homepage with server.
# SSH access to server is required.
# ! do not commit any private data/password/codes in the repository !
################################################################################
# Server-Name: h2389049.stratoserver.net
# Login: root
# Heimatverz.: /root
# WWW-Verz.: /var/www/html
################################################################################

rsync -rtvuc --delete ./livermetabolism/_site/ mkoenig@h2389049.stratoserver.net:/var/www/html

