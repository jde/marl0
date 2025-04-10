FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
COPY .env ./

# Install dependencies and generate Prisma client
RUN npm install

# Build app
RUN npm run build

EXPOSE 4242

CMD ["npm", "start"]
