FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm i -g pnpm typescript && pnpm install
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=backend-builder /app/dist ./dist
COPY package*.json ./
RUN npm i -g pnpm && pnpm install --prod
USER node
EXPOSE 4003
CMD ["node", "dist/index.js"]
