FROM oven/bun:1.1.24

WORKDIR /app
COPY ./ ./
COPY package.json ./
RUN bun install
EXPOSE 3000
CMD bun run ./src/utilhq.ts
