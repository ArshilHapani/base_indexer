setup-server:
	@bun install
	@cp .env.example .env
	@echo "Add environment variables in .env file"

start-redis-server:
	@podman run -d --name redis-stellus -p 6379:6379 redis:latest

start-server:
	@if ! podman ps --format "{{.Names}}" | grep -q "^redis-stellus$$"; then \
		echo "Starting Redis Server"; \
		$(MAKE) start-redis-server; \
	fi
	@bun start

stress-test-ab:
	@ab -n 5000 -c 500 http://localhost:5000/api/v1/tokens/0xca4569949699d56e1834efe9f58747ca0f151b01

stress-test-k6:
	@k6 run tests/stress-test.js