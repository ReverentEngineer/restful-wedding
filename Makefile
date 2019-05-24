DOCKER_TAG=reverentengineer/restful_wedding
TEST_NAME=restful_wedding_test

build:
	docker build -t $(DOCKER_TAG) .

app/node_modules:
	cd app && npm install

run: app/node_modules
	cd app && NODE_ENV=development ./bin/www

.PHONY: run
