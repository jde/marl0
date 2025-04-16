# --- Build stage ---
FROM golang:1.24.2-alpine AS builder

WORKDIR /app

COPY . .

RUN apk add --no-cache ca-certificates

RUN go build -o story-writer story-writer.go

# --- Runtime stage ---
FROM alpine:3.18

WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=builder /app/story-writer /app/story-writer

CMD ["/app/story-writer"]
