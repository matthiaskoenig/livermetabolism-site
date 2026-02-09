# ------------------
# livermetabolism.com
# ------------------
access_log /var/www/logs/livermetabolism.com_access.log;
error_log /var/www/logs/livermetabolism.com_error.log;

server {
    listen 80;
    listen [::]:80;

    server_name www.livermetabolism.com www.livermetabolism.de livermetabolism.de www.pharma-twin.eu pharma-twin.eu www.pharma-twin.de pharma-twin.de www.perfect-kid.eu perfect-kid.eu;

    # letsencrypt webroot authenticator
    location /.well-known/acme-challenge/ {
        root /usr/share/nginx/letsencrypt;
    }

    # https redirects
    location = / {
        return 301 https://livermetabolism.com$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name www.livermetabolism.com www.livermetabolism.de livermetabolism.de www.pharma-twin.eu pharma-twin.eu www.pharma-twin.de pharma-twin.de www.perfect-kid.eu perfect-kid.eu;
    ssl_certificate     /etc/letsencrypt/live/livermetabolism.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/livermetabolism.com/privkey.pem;

    return 301 https://livermetabolism.com$request_uri;
}

server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;

        server_name livermetabolism.com;

        ssl_certificate     /etc/letsencrypt/live/livermetabolism.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/livermetabolism.com/privkey.pem;
        include /etc/nginx/snippets/ssl.conf;

        client_max_body_size 100m;
        proxy_connect_timeout       900;
        proxy_send_timeout          900;
        proxy_read_timeout          900;
        send_timeout                900;

        location / {
                # denbi-cloud: node5
                proxy_pass http://192.168.0.175:80;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-for $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                # port_in_redirect off;
        }
}
