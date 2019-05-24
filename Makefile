DOCKER_TAG=reverentengineer/restful_wedding
TEST_NAME=restful_wedding_test

build:
	docker build -t $(DOCKER_TAG) .

app/node_modules:
	cd app && npm install

run: app/node_modules
	cd app && NODE_ENV=development ./bin/www

push: build
	docker push $(DOCKER_TAG)

test: app/node_modules
	cd app && npm test

.PHONY: run push build test 
