######################################################################
######################## BASIC CONFIGURATION ########################
######################################################################

# Redis configuration
REDIS_IMAGE=redis:7.4.1-alpine
REDIS_CONTAINER=redis-stellus
REDIS_PORT=6379

# Postgres configuration
POSTGRES_IMAGE=postgres:17.2-alpine3.21
POSTGRES_CONTAINER=postgres-stellus
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# InfluxDB configuration
INFLUX_IMAGE=influxdb:2.7-alpine
INFLUX_CONTAINER=influxdb-stellus
INFLUX_DB_PORT=8086
INFLUX_DB_MOUNT_PATH=$(HOME)/.config/influxdb2/data
INFLUX_DB_MOUNT_PATH_CONFIG=$(HOME)/.config/influxdb2/config
INFLUX_DB_INIT_MODE=setup
INFLUX_DB_USERNAME=admin
INFLUX_DB_PASSWORD=admin
INFLUX_DB_RETENTION_POLICY=1000000w
INFLUX_DB_ORGANIZATION_NAME=stellus
INFLUX_DB_BUCKET_NAME=stellus_influx_bucket
INFLUX_DB_ADMIN_TOKEN=stellus_influx_token

# Application configuration
APP_CONTAINER=defi-backend-container
APP_IMAGE=defi-backend:latest
APP_PORT=5000
MANAGER_PORT=5010

.PHONY: setup-server start-redis-server start-postgres-server start-server stress-test-ab stress-test-k6 build-image start-container push-image worker-tokenConsumer schedule-cron start-task-manager start-consumer-via-manager start-cron-via-manager prisma-studio spin-required-servers start-influxdb-server


######################################################################
############################# DIRECTIVES #############################
######################################################################

######################################################################
######################################################################
######################################################################

######################################################################
############################### SERVER ###############################
######################################################################

setup-server:
	@bun install
	@cp .env.example .env
	@echo "Add environment variables in .env file"

start-redis-server:
	@if [ -z "$$(docker ps -a --filter "name=$(REDIS_CONTAINER)" --format '{{.Names}}')" ]; then \
		echo "Starting new Redis container..."; \
		docker run -d \
		--name $(REDIS_CONTAINER) \
		-p 6379:$(REDIS_PORT) \
		$(REDIS_IMAGE); \
	else \
		echo "Redis container exists. Starting it..."; \
		docker start $(REDIS_CONTAINER); \
	fi

start-postgres-server:
	@if [ -z "$$(docker ps -a --filter "name=$(POSTGRES_CONTAINER)" --format '{{.Names}}')" ]; then \
		echo "Starting new Postgres container..."; \
		docker run -d \
			--name $(POSTGRES_CONTAINER) \
			-p 5432:$(POSTGRES_PORT) \
			-e POSTGRES_USER=$(POSTGRES_USER) \
			-e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) \
			$(POSTGRES_IMAGE); \
	else \
		echo "Postgres container exists. Starting it..."; \
		docker start $(POSTGRES_CONTAINER); \
	fi

start-influxdb-server:
	@if [ -z "$$(docker ps -a --filter "name=$(INFLUX_CONTAINER)" --format '{{.Names}}')" ]; then \
		docker run -d \
				--name=$(INFLUX_CONTAINER) \
				-p 8086:$(INFLUX_DB_PORT) \
				$(INFLUX_IMAGE); \
	else \
		docker start $(INFLUX_CONTAINER); \
	fi


spin-required-servers:
	@$(MAKE) start-redis-server
	@$(MAKE) start-postgres-server
	@$(MAKE) start-influxdb-server

start-server:
	@docker container rm -f $(REDIS_CONTAINER) || true
	@$(MAKE) spin-required-servers
	@bun start
	@if [ -n "$(STUDIO)" ]; then \
		$(MAKE) prisma-studio; \
	fi

stop-server:
    # stop all the running containers
	@docker container stop $(REDIS_CONTAINER) || true
	@docker container stop $(POSTGRES_CONTAINER) || true
	@docker container stop $(INFLUX_CONTAINER) || true
	@docker container stop $(APP_CONTAINER) || true	

######################################################################
############################### TESTS ###############################
######################################################################

stress-test-ab:
	@ab -n 5000 -c 500 http://localhost:5000/api/v1/tokens/0xca4569949699d56e1834efe9f58747ca0f151b01

stress-test-k6:
	@k6 run tests/stress-test.js

######################################################################
######################### APPLICATION IMAGE #########################
######################################################################

build-image:
	@docker build -t defi-backend:latest .

start-container:
	@docker run -d --name $(APP_CONTAINER) --network="host" --env-file .env -p 5000:$(APP_PORT) $(APP_IMAGE)

push-image:
	@if [ -z "$(TAG)" ]; then echo "Error: TAG is not set. Use 'make push-image TAG=<tag>'"; exit 1; fi
	@echo "Logging in to Docker Hub..."
	@docker login docker.io || { echo "Docker login failed"; exit 1; }
	@echo "Tagging image..."
	@docker tag defi-backend:latest docker.io/arshilhapani/defi-backend:$(TAG) || { echo "Image tagging failed"; exit 1; }
	@echo "Pushing image to Docker Hub with tag $(TAG)..."
	@docker push docker.io/arshilhapani/defi-backend:$(TAG) || { echo "Image push failed"; exit 1; }
	@echo "Image successfully pushed as arshilhapani/defi-backend:$(TAG)"

######################################################################
######################## APPLICATION SCRIPTS ########################
######################################################################

worker-tokenConsumer:
	@bun run worker:tokenConsumer

schedule-cron:
	@bun run cron:getTokens

start-task-manager:
	@bun run start-manager

start-consumer-via-manager:
	@if [ -z "$(TASK)" ]; then echo "Error: Task is not set. Use 'make start-consumer-via-manager TASK=<task>'"; exit 1; fi
	@curl "http://localhost:$(MANAGER_PORT)/start?task=consumer"

start-cron-via-manager:
	@curl "http://localhost:$(MANAGER_PORT)/start?task=cron"

prisma-studio:
	@bunx prisma studio
