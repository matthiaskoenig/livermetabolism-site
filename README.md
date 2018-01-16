# livermetabolism-site

Code for https://www.livermetabolism.com/.

**Bug Tracker**: https://github.com/matthiaskoenig/livermetabolism-site/issues  

## License
* Source Code: [LGPLv3](http://opensource.org/licenses/GPL-3.0)
* Documentation: [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/)

## Build page
The page is built using Jekyll with additional site templates 
* http://jekyllrb.com/
* 

```
cd livermetabolism
jekyll serve
jekyll build --watch
```

## Update server
The data on the server is updated with the script
```
sync_with_server.sh
```

## Setup
```
sudo apt-get install ruby ruby-dev
gem install jekyll bundler
cd livermetabolism
bundle exec jekyll serve

```

----
&copy; 2018 Matthias König.