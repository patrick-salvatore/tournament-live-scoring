run: build
	@./bin/app serve

build: 
	@go build -o bin/app .
