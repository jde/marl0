FROM debian:bullseye-slim

# Install curl and Ollama
RUN apt-get update && \
    apt-get install -y curl ca-certificates && \
    curl -fsSL https://ollama.ai/install.sh | sh

ENTRYPOINT ["ollama"]
