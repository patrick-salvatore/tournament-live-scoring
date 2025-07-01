run: build
	@./tmp/main serve

build: 
	@go build -o ./tmp/main .

image: 
	docker build -t tournament-live-scoring .

docker: image
	docker run -p 8080:8080 tournament-live-scoring