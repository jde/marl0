#!/bin/bash

set -e

MODEL_NAME=tinyllama

# Check if model is already downloaded
if ! ollama list | grep -q "$MODEL_NAME"; then
  echo "🧩 Model not found. Pulling $MODEL_NAME..."
  ollama pull "$MODEL_NAME"
else
  echo "✅ Model $MODEL_NAME already present."
fi

# Start the Ollama server
exec ollama serve
