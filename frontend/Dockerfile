FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

COPY . .

COPY .env.local .env.local

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

RUN npm install --production

EXPOSE 3000

CMD ["npm", "start"]