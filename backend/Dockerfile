# backend/Dockerfile
FROM node:18

WORKDIR /app

COPY backend/package*.json ./
COPY core-engine/src /app/core-engine

RUN npm install -g pnpm
RUN pnpm install

COPY backend /app/backend

EXPOSE 3000
CMD ["pnpm", "start"]
