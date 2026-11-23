# The Seat of Power, Vatar edition: the built game (public/) and its server.
# Build context is the repository root (see railway.json).
FROM node:20-alpine
WORKDIR /app
COPY public ./public
COPY server ./server
# The guide's content (server/wiki.mjs reads it): plain modules, no build step.
COPY game/systems/guide.js game/systems/glossary.js ./game/systems/
RUN echo '{"type":"module"}' > ./game/package.json
RUN cd server && npm install --omit=dev --no-audit --no-fund
ENV NODE_ENV=production DATA_DIR=/data
EXPOSE 8080
CMD ["node", "server/vatar-server.mjs"]
