FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3333

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]