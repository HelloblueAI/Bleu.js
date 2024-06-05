# frontend/Dockerfile
FROM node:18

WORKDIR /app

COPY frontend/package*.json ./
COPY core-engine/src /app/core-engine

RUN npm install -g pnpm
RUN pnpm install

COPY frontend /app/frontend

EXPOSE 8080
CMD ["pnpm", "run", "serve"]
