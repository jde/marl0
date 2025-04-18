# Build stage
FROM golang:1.24.2-alpine AS builder

WORKDIR /app

# Install Kafka C library dependency (required by segmentio/kafka-go if using TLS, not strictly needed here)
RUN apk add --no-cache git

COPY . .

RUN go build -o mention-extractor .

# Final image
FROM alpine:3.18

WORKDIR /app

COPY --from=builder /app/mention-extractor .

CMD ["./mention-extractor"]
