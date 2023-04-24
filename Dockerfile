FROM node:14.15.4-alpine AS builder
WORKDIR /app
COPY . .
FROM node:14.15.4-alpine
WORKDIR /app
COPY --from=builder /app ./

RUN apk add --no-cache bash
RUN yarn install
RUN yarn build

#COPY . .

RUN yarn
RUN yarn build

ENV NODE_ENV staging

CMD ["node", "dist/main.js"]