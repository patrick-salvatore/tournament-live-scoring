run: build
	@./tmp/main serve

build: 
	@go build -o ./tmp/main .
