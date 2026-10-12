# The Seat of Power, Vatar edition: the built game (public/) and its server.
# Build context is the repository root (see railway.json).
FROM node:20-alpine
WORKDIR /app
COPY public ./public
COPY server ./server
ENV NODE_ENV=production DATA_DIR=/data
EXPOSE 8080
CMD ["node", "server/vatar-server.mjs"]
