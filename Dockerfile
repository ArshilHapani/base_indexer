FROM oven/bun:slim as base

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .


USER bun
EXPOSE 5000/tcp
ENTRYPOINT [ "bun", "start" ]
