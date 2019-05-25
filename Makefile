DOCKER_TAG=reverentengineer/mail-virtualdb

prepare:
	npm install


test: prepare
	npm test

build: test
	docker build -t $(DOCKER_TAG):latest .

deploy: build
	npm publish
	docker push $(DOCKER_TAG):latest

.PHONY: prepare build test deploy
