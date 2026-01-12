# livermetabolism-site

Code and material for static site at [https://www.livermetabolism.com/](https://www.livermetabolism.com/).

**Bug Tracker**: https://github.com/matthiaskoenig/livermetabolism-site/issues

## License

* Source Code: [MIT](https://opensource.org/licenses/mit)
* Documentation: [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/)

## Build page

The page is built using Jekyll with additional site templates

* http://jekyllrb.com/
* [Jekyll Doc Theme](https://aksakalli.github.io/jekyll-doc-theme/)

## Local development

### Run development server

```bash
docker compose -f docker-compose-serve.yml up
```


## Deployment

sudo cp -v /var/git/livermetabolism-site/nginx/livermetabolism.com /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/livermetabolism.com /etc/nginx/sites-enabled/
sudo service nginx status

### HTTPS certificates

#### Initial certificates & renewal

```bash
# access server
ssh denbi-head

sudo mkdir -p /usr/share/nginx/letsencrypt
sudo certbot certonly --webroot -w /usr/share/nginx/letsencrypt -d livermetabolism.com -d www.livermetabolism.com -d livermetabolism.de -d www.pharma-twin.eu -d pharma-twin.eu -d www.pharma-twin.de -d pharma-twin.de -d www.livermetabolism.de --dry-run
```

Renew certificates
```
sudo certbot renew --dry-run
```

### Update site
#### Connect to server
```bash
ssh denbi-node-7
```

#### Initial setup
```bash
# download code
mkdir ~/git
cd ~/git
git clone https://github.com/matthiaskoenig/livermetabolism-site.git
cd livermetabolism-site
mkdir web
sudo chown $USER:$USER web
```

#### Update page
```bash
cd ~/git/livermetabolism-site
./deploy.sh
```

## Python package

```bash
uv sync
```

----
&copy; 2016-2026 Matthias König.
