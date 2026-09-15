"""Exercise both production nginx HTTP redirect configurations in isolated containers.

Requires Docker, openssl, and the nginx image pinned in docker-compose.yml.
Run from any directory: python3 scripts/check-nginx-redirects.py
No production certificates or services are accessed.
"""
import http.client
from pathlib import Path
import re
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]


def run(*args):
    return subprocess.check_output(args, text=True).strip()


def main():
    image = re.search(r"image:\s*(nginx:\S+)", (ROOT / 'docker-compose.yml').read_text())[1]
    hosts = re.search(r"server_name\s+([^;]+);", (ROOT / 'nginx/livermetabolism.com').read_text())[1].split()
    hosts = list(dict.fromkeys(['livermetabolism.com', *hosts]))
    failures = []
    checks = 0
    with tempfile.TemporaryDirectory(prefix='livermetabolism-nginx-') as directory:
        temp = Path(directory)
        cert = temp / 'cert'
        cert.mkdir()
        subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
                        '-subj', '/CN=livermetabolism.com', '-keyout', str(cert / 'privkey.pem'),
                        '-out', str(cert / 'fullchain.pem')], check=True, capture_output=True)
        challenge = temp / 'webroot/.well-known/acme-challenge'
        challenge.mkdir(parents=True)
        (challenge / 'review-token').write_text('review-proof')
        for name in ['livermetabolism.com', 'nginx_ssl.conf']:
            config = (ROOT / 'nginx' / name).read_text()
            if name == 'livermetabolism.com':
                # A default virtual host exposes missing canonical server_name entries.
                config = 'events {}\nhttp {\ninclude /etc/nginx/mime.types;\nserver { listen 80 default_server; return 421; }\n' + config + '\n}\n'
            (temp / 'nginx.conf').write_text(config)
            mounts = ['--mount', f'type=bind,src={temp / "nginx.conf"},dst=/etc/nginx/nginx.conf,readonly',
                      '--mount', f'type=bind,src={cert},dst=/etc/letsencrypt/live/livermetabolism.com,readonly',
                      '--mount', f'type=bind,src={ROOT / "nginx/ssl.conf"},dst=/etc/nginx/snippets/ssl.conf,readonly',
                      '--mount', f'type=bind,src={temp / "webroot"},dst=/usr/share/nginx/letsencrypt,readonly',
                      '--tmpfs', '/logs', '--tmpfs', '/var/www/logs']
            run('docker', 'run', '--rm', *mounts, image, 'nginx', '-t')
            container = run('docker', 'run', '--rm', '-d', '-p', '127.0.0.1::80', *mounts, image)
            try:
                port = int(run('docker', 'port', container, '80/tcp').rsplit(':', 1)[1])
                for attempt in range(50):
                    try:
                        connection = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
                        connection.request('GET', '/', headers={'Host': hosts[0]})
                        connection.getresponse().read()
                        connection.close()
                        break
                    except (OSError, http.client.HTTPException):
                        if attempt == 49:
                            raise
                        time.sleep(0.1)
                for host in hosts:
                    for path in ['/', '/publications/', '/news/?tag=AI%20models', '/assets/pdf/test.pdf',
                                 '/.well-known/acme-challenge/review-token', '/.well-known/acme-challenge/missing']:
                        connection = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
                        connection.request('GET', path, headers={'Host': host})
                        response = connection.getresponse()
                        body = response.read().decode()
                        location = response.getheader('Location')
                        connection.close()
                        checks += 1
                        if path.endswith('/review-token'):
                            ok = response.status == 200 and body == 'review-proof' and location is None
                        elif path.endswith('/missing'):
                            ok = response.status == 404 and location is None
                        else:
                            ok = response.status == 301 and location == f'https://livermetabolism.com{path}'
                        if not ok:
                            failures.append(f'{name}: {host}{path}: status={response.status}, Location={location}')
            finally:
                run('docker', 'stop', container)
    for failure in failures[:12]:
        print(failure)
    print(f'{checks} HTTP checks, {len(failures)} failures')
    return bool(failures)


if __name__ == '__main__':
    raise SystemExit(main())
