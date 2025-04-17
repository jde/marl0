FROM golang:1.24.2-alpine AS builder

WORKDIR /app

# Copy go mod files separately to cache deps
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of your source files
COPY . .

RUN go build -o view-memgraph .

# --- Runtime container ---
FROM alpine:3.18

WORKDIR /app
COPY --from=builder /app/view-memgraph .

CMD ["./view-memgraph"]
