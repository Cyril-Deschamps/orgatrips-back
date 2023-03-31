FROM node:14-alpine
WORKDIR /app
CMD yarn run start
COPY node_modules ./node_modules
COPY yarn.lock ./yarn.lock
COPY scripts ./scripts
COPY .env ./
COPY app ./app
COPY package* ./
COPY storage ./storage
EXPOSE 80
