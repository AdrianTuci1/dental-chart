FROM node:22-alpine

WORKDIR /app

COPY apps/backend/package*.json ./
RUN npm ci --omit=dev

COPY apps/backend/ ./
COPY LICENSE NOTICE ./

EXPOSE 3100

CMD ["npm", "start"]
