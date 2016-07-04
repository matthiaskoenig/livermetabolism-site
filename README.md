# livermetabolism-site

Code for https://www.livermetabolism.com/.

<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&amp;hosted_button_id=RYHNRJFBMWD5N" title="Donate to this project using Paypal"><img src="https://img.shields.io/badge/paypal-donate-yellow.svg" alt="PayPal donate button" /></a>

**Bug Tracker**: https://github.com/matthiaskoenig/livermetabolism/issues  

## License
* Source Code: [GPLv3](http://opensource.org/licenses/GPL-3.0)
* Documentation: [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/)

## Build page
The page is built using Jekyll (http://jekyllrb.com/).

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
