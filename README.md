# livermetabolism-site
Code and material for static site at [https://www.livermetabolism.com/](https://www.livermetabolism.com/).

**Bug Tracker**: https://github.com/matthiaskoenig/livermetabolism-site/issues  

## License
* Source Code: [LGPLv3](http://opensource.org/licenses/GPL-3.0)
* Documentation: [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/)

## Build page
The page is built using Jekyll with additional site templates 
* http://jekyllrb.com/
* [Jekyll Doc Theme](https://aksakalli.github.io/jekyll-doc-theme/)


## Local development
### Run development server
```
docker-compose -f docker-compose-serve.yml up
```
Change the web content in the `./app/` folder.


### Update dependencies
Delete the `Gemfile.lock`
```
docker run --rm --volume="$PWD:/srv/jekyll" --volume="$PWD/vendor/bundle:/usr/local/bundle" -it jekyll/jekyll:latest bundle update
```
### Build web content
```
docker-compose -f docker-compose-build.yml up
```

## Deployment

### HTTPS certificates
#### Initial certificates & renewal
```bash
# access server
ssh h2389049.stratoserver.net
# https certificates
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install -y certbot

# initial certificates
cd /home/mkoenig/git/livermetabolism-site
docker-compose down
sudo certbot certonly
livermetabolism.com www.livermetabolism.com livermetabolism.de www.livermetabolism.de liver-metabolism.com www.liver-metabolism.com liver-metabolism.de www.liver-metabolism.de
docker-compose up --build -d

# certificate renewal 
cd /home/mkoenig/git/livermetabolism-site
docker-compose down
sudo certbot renew
docker-compose up --build -d
```


### deploy
```bash
# access server
ssh h2389049.stratoserver.net

# download code
mkdir /home/mkoenig/git
git clone https://github.com/matthiaskoenig/livermetabolism-site
# get latest code
cd /home/mkoenig/git/livermetabolism-site
git pull
# stop nginx
docker-compose down
# build web content
docker-compose -f docker-compose-build.yml up
# start nginx service
docker-compose up --build -d
```

### update
Execute the `./deploy.sh` script which downloads the latest changes and updates the page.

## TODO
### minor
* add circadian modelling project
* add publications with acknowledgements
* add media section with systemsbiology.de
* add mentoring GSOC info
* add software project information

----
&copy; 2016-2020 Matthias König.
