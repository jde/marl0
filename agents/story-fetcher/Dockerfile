# --- Builder Stage ---
FROM golang:1.24.2-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o story-fetcher .

# --- Runtime Stage ---
FROM alpine:3.18

RUN apk add --no-cache \
    ca-certificates \
    chromium \
    ttf-freefont \
    dumb-init

ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/

WORKDIR /app
COPY --from=builder /app/story-fetcher .

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./story-fetcher"]
