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

### Deploy and update server
```bash
# get latest code
cd /var/git/livermetabolism-site/
git pull
# update web content
docker-compose -f docker-compose-build.yml up

# start nginx service
docker-compose up
```

## Local Setup (deprecated !)
### Install `ruby` and `jekyll`
```
sudo apt-get install ruby ruby-dev
gem install jekyll bundler
```

### Update dependencies
```
rm Gemfile.lock
bundle update
```

### Run development server
```
cd livermetabolism
jekyll serve
```

### Deploy & Update server
The data on the server is updated with the script
```
cd livermetabolism
jekyll build
cd ..
./sync_with_server.sh
```

----
&copy; 2016-2019 Matthias König.