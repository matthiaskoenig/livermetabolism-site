#!/bin/bash
# plays the changes in koenig to the server
# SSH access to the server is provided
########################################
# Server-Name: h2389049.stratoserver.net
# Login: root
# Heimatverz.: /root
# WWW-Verz.: /var/www/html
########################################

rsync -rtvuc --delete ./ mkoenig@h2389049.stratoserver.net:/var/www/html


