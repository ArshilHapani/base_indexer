setup-server:
	@bun install
	@cp .env.example .env

start-redis-server:
	@podman run -d --name redis-stellus -p 6379:6379 redis:latest

start-server:
	@bun start