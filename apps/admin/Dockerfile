FROM node:22-alpine AS build

WORKDIR /app

COPY apps/admin/package*.json ./
RUN npm ci

COPY apps/admin/ ./

ARG VITE_API_URL=http://localhost:3100
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY LICENSE NOTICE /usr/share/nginx/html/

EXPOSE 80
