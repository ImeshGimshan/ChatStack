FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build the NestJS app
RUN npm run build

EXPOSE 3001

# Run the app in production mode
CMD ["npm", "run", "start:prod"]