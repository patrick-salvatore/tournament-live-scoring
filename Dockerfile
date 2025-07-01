# --- Stage 1: Build UI ---
FROM node:20-alpine AS ui-builder

COPY . .

WORKDIR /ui

RUN npm ci

RUN npm run build

# --- Stage 2: Build Go App ---
FROM golang:1.23-alpine AS go-builder

RUN apk add --no-cache git

WORKDIR /

RUN apk add build-base
COPY . .

COPY --from=ui-builder ./ui/build/client ./ui/build/client

# RUN mkdir -p ./tmp

RUN go build -o ./tmp/main .

# --- Stage 3: Run ---
FROM alpine:latest

# Only copy compiled Go binary
COPY --from=go-builder . .

ARG PB_VERSION=0.28.4

RUN apk add --no-cache \
    unzip \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 8080

# start PocketBase
CMD ["./tmp/main", "serve", "--http=0.0.0.0:8080"]