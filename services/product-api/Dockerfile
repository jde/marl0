# Base image
FROM node:18-alpine
# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy everything
COPY . .

# Ensure the entrypoint script is executable
RUN chmod +x ./entrypoint.sh

# Install dependencies
RUN npm install
RUN npx prisma generate

EXPOSE 3000

ENTRYPOINT ["sh", "./entrypoint.sh"]
