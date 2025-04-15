# --- Build stage ---
FROM golang:1.24.2-alpine AS builder

WORKDIR /app

COPY . .

# Only necessary for Prometheus and XML parser; no gcc/sqlite-dev needed now
RUN apk add --no-cache ca-certificates

RUN go build -o sitemap-watcher main.go

# --- Runtime stage ---
FROM alpine:3.18

WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /app/sitemap-watcher /app/sitemap-watcher
COPY ./sitemaps.csv /app/sitemaps.csv

CMD ["/app/sitemap-watcher"]
