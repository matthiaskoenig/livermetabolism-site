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

## Setup
```
sudo apt-get install ruby ruby-dev
gem install jekyll bundler
```

## Run server
```
cd livermetabolism
bundle exec jekyll serve
```


## Deploy & Update server
The data on the server is updated with the script
```
cd livermetabolism
JEKYLL_ENV=production bundle exec jekyll build
cd ..
./sync_with_server.sh
```

----
&copy; 2016-2018 Matthias König.