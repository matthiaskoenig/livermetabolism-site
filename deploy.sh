# latest changes
git pull
# stop nginx
docker-compose down
# build web content
docker-compose -f docker-compose-build.yml up
# start nginx service
docker-compose up --build -d