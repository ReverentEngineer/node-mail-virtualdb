DOCKER_TAG=reverentengineer/mail-virtualdb

all: build

node_modules:
	npm install

test: node_modules
	npm test

build: test
	docker build -t $(DOCKER_TAG):latest .

push: build
	docker push $(DOCKER_TAG):latest

publish: test
	npm publish

.PHONY: prepare build test deploy
