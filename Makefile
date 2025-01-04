setup-server:
	@bun install
	@cp .env.example .env
	@echo "Add environment variables in .env file"

start-redis-server:
	@podman run -d --name redis-stellus -p 6379:6379 redis:latest

start-server:
	@podman container rm -f redis-stellus || true
	@if ! podman ps --format "{{.Names}}" | grep -q "^redis-stellus$$"; then \
		echo "Starting Redis Server"; \
		$(MAKE) start-redis-server; \
	fi
	@bun start

stress-test-ab:
	@ab -n 5000 -c 500 http://localhost:5000/api/v1/tokens/0xca4569949699d56e1834efe9f58747ca0f151b01

stress-test-k6:
	@k6 run tests/stress-test.js

build-image:
	@docker build -t defi-backend:latest .

start-container:
	@docker run -d --name defi-backend-container --network="host" --env-file .env -p 5000:5000 defi-backend:latest

push-image:
	@if [ -z "$(TAG)" ]; then echo "Error: TAG is not set. Use 'make push-image TAG=<tag>'"; exit 1; fi
	@echo "Logging in to Docker Hub..."
	@docker login docker.io || { echo "Docker login failed"; exit 1; }
	@echo "Tagging image..."
	@docker tag defi-backend:latest docker.io/arshilhapani/defi-backend:$(TAG) || { echo "Image tagging failed"; exit 1; }
	@echo "Pushing image to Docker Hub with tag $(TAG)..."
	@docker push docker.io/arshilhapani/defi-backend:$(TAG) || { echo "Image push failed"; exit 1; }
	@echo "Image successfully pushed as arshilhapani/defi-backend:$(TAG)"
