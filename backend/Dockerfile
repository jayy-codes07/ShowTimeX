FROM node:20-alpine

WORKDIR /app

# Install production dependencies first so this layer is cached between
# source changes.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

USER node

CMD ["node", "server.js"]
