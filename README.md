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


# setup server




## Docker
### Run development server
```
docker-compose -f docker-compose-serve.yml up
# docker run --rm --volume="$PWD:/srv/jekyll" --volume="$PWD/vendor/bundle:/usr/local/bundle" -p 4000:4000 -it jekyll/jekyll:latest jekyll serve
```

### Update dependencies
```
docker run --rm --volume="$PWD:/srv/jekyll" --volume="$PWD/vendor/bundle:/usr/local/bundle" -it jekyll/jekyll:latest bundle update
```

### HTTPS certificates
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install -y python-certbot-nginx 
# Initial certificates
sudo certbot certonly
livermetabolism.com www.livermetabolism.com livermetabolism.de www.livermetabolism.de liver-metabolism.com www.liver-metabolism.com liver-metabolism.de www.liver-metabolism.de

sudo chown mkoenig:mkoenig /etc/letsencrypt/live/

### Deploy and update server
```bash
# access server
ssh strato

# download code
mkdir /home/mkoenig/git
git clone https://github.com/matthiaskoenig/livermetabolism-site

# get latest code
cd /home/mkoenig/git/livermetabolism-site
git pull
# update web content
docker-compose -f docker-compose-build.yml up

# start nginx service
docker-compose up
```

----
&copy; 2016-2019 Matthias König.