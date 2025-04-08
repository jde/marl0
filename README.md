# 🧩 Marl0 AI Pipeline Infrastructure

This repository contains the infrastructure setup for a real-time, experimental AI pipeline.  
The goal is a fully containerized, local and server-deployable environment with:

- ✅ **Node.js / Go** application container (data flow orchestration)
- ✅ **Postgres** (structured data storage)
- ✅ **Kafka** (event streaming backbone)
- ✅ **Memgraph** (graph database for relationships and real-time alerting)
- ✅ **LanceDB** (vector database for semantic search)
- ✅ **Redis** (cache / pub-sub, fast ephemeral storage)
- ✅ **MinIO** (S3-compatible object storage)
- ✅ **Prometheus + Grafana** (observability, monitoring, dashboards)
- ✅ Environment-based storage mapping (SSD, RAM disk, local folders)
- ✅ Makefile-powered ergonomic dev workflow

This setup allows:
- Local development with full hot-reload and inspectable data
- Production deployment with control over physical disk & memory mapping
- Experimental rebuilds and partial injections into a persistent graph
- Real-time event-driven processing with observability

---

## 🗂 Project Structure

```
/app/                  # Application code (Node.js or Go)
/docker_data/          # Local dev data volumes (tracked in Git, data ignored)
/monitoring/           # Prometheus configuration
docker-compose.yml     # Main Docker Compose configuration
.env.dev               # Development environment variables
.env.prod              # Production environment variables
docker-run.sh          # Unified Docker runner script
Makefile               # Developer ergonomic commands
README.md              # Project documentation
```

---

## 🚀 Running the Stack

This project uses Docker Compose and Makefile commands for local development and production deployment, with environment-specific configurations.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)
- GNU Make (comes pre-installed on macOS and Linux)

### Quickstart

Make the `docker-run.sh` script executable:

```bash
chmod +x docker-run.sh
```

Then build and start the stack in dev mode:

```bash
make rebuild
```

### Environment Control

The environment is controlled via the `ENV` variable.

Available environments:
- `dev` — Local development environment (default)
- `prod` — Production or staging environment (customize your `.env.prod`)

Example:

```bash
make rebuild ENV=prod
```

---

## 🧩 Makefile Commands

Run `make help` to see all available commands:

```
make help
```

### Core Commands

| Command               | Description                                      |
|-----------------------|--------------------------------------------------|
| `make rebuild`        | Rebuild and run stack in detached mode          |
| `make up`             | Start stack in detached mode                    |
| `make stop`           | Stop running containers                         |
| `make down`           | Stop and remove containers, networks, volumes   |
| `make ps`             | Show running services                           |
| `make config`         | Show effective Docker Compose config            |
| `make validate`       | Validate environment and bind-mount paths       |

### Logs

| Command                 | Description                          |
|-------------------------|--------------------------------------|
| `make logs`             | Tail all service logs                |
| `make logs-app`         | Tail App service logs                |
| `make logs-kafka`       | Tail Kafka service logs              |
| `make logs-lancedb`     | Tail LanceDB service logs            |
| `make logs-postgres`    | Tail Postgres service logs           |
| `make logs-memgraph`    | Tail Memgraph service logs           |
| `make logs-prometheus`  | Tail Prometheus service logs         |
| `make logs-grafana`     | Tail Grafana service logs            |
| `make logs-redis`       | Tail Redis service logs              |
| `make logs-zookeeper`   | Tail Zookeeper service logs          |

### Service Builds

| Command                   | Description                        |
|---------------------------|------------------------------------|
| `make build-app`           | Build App service                  |
| `make build-lancedb`       | Build LanceDB service              |
| `make build-kafka`         | Build Kafka service                |

---

## ⚙️ Services Overview

| Service        | Description                                         | Ports (Dev) |
| -------------- | --------------------------------------------------- | ----------- |
| App            | Node.js / Go application container                  | 4200        |
| Kafka          | Event streaming backbone                            | 4292        |
| Zookeeper      | Kafka coordination                                 | 4218        |
| Postgres       | Structured data storage                            | 4242        |
| Memgraph       | Graph database (Bolt + Lab UI)                     | 4287 / 4201 |
| LanceDB        | Vector database for semantic search                 | 4280        |
| Redis          | Fast ephemeral cache                               | 4279        |
| MinIO          | S3-compatible object storage (API + Console)        | 4202 / 4203 |
| Prometheus     | Metrics collection                                 | 4204        |
| Grafana        | Monitoring dashboards                              | 4205        |

> **Note:** All ports are mapped in the 42xx range to avoid local port conflicts.

---

## 💾 Storage Strategy

Data storage is environment-controlled for flexibility between local dev and production.

### Development (`.env.dev`)

Data is stored in project-local `./docker_data/` directories for easy inspection.

### Production (`.env.prod`)

Physical drives and RAM disks can be mapped for performance.

Example:

```
POSTGRES_DATA_DIR=/mnt/fast_ssd/postgres_data
MEMGRAPH_DATA_DIR=/mnt/fast_ssd/memgraph_data
REDIS_DATA_DIR=/mnt/ramdisk/redis_data
...
```

> Update paths in `.env.prod` according to your server's physical storage layout.

---

### 📂 Persistent Data Directories

This project uses **bind-mounted directories** for persistent data storage during development and production.  
To keep the repository as the single source of truth, we **track directory structures in Git**, but **ignore their contents.**

> **Important:**  
> All persistent data directories are tracked in Git using `.gitkeep` files.  
> This ensures the directory structure exists in the repo, while runtime data is ignored.

#### Pattern

- ✅ **Tracked in Git:** Directory paths with `.gitkeep` files.
- ❌ **Ignored in Git:** Runtime data (Postgres, LanceDB, Redis, etc.).

#### Tracked Directories (example):

```
docker_data/lancedb/.gitkeep
docker_data/postgres/.gitkeep
docker_data/memgraph/.gitkeep
docker_data/redis/.gitkeep
docker_data/minio/.gitkeep
docker_data/grafana/.gitkeep
```

#### When adding a new service:
1. Create the new data directory:
   ```bash
   mkdir -p docker_data/myservice
   ```
2. Add a `.gitkeep` file:
   ```bash
   touch docker_data/myservice/.gitkeep
   ```
3. Commit the directory and `.gitkeep` to the repository.

> **Note:**  
> In **production**, missing directories will cause the build to fail intentionally.  
> In **development**, directories are expected to exist in the repo — they are not auto-created.

---

### 📒 Git Ignore Rules

The repository includes `.gitignore` entries to ignore all data contents but track the directory structures:

```
# Ignore contents of docker_data but keep directories
docker_data/*
!docker_data/**/.gitkeep
```

This ensures:
- ✅ Clean repository
- ✅ Reproducible environments
- ✅ No accidental commits of local data

---

### 🧩 Summary

✅ **Repository is the source of truth.**  
✅ **Developers control data directories explicitly.**  
✅ **Production is safe by design — fails fast if something is wrong.**

---

## 🔮 Next Steps

Planned improvements:

- [ ] Add Prometheus exporters (Kafka, Postgres, Redis, Node.js metrics)
- [ ] Automate Grafana dashboard provisioning
- [ ] Set up hot reload in app container
- [ ] Wire Kafka flow: produce → consume → database writes
- [ ] Add Graph ingestion service to Memgraph
- [ ] Implement real-time triggers and alerts
- [ ] Prepare for cloud / cluster deployment (optional)

---

## 🧑‍💻 Contributions

This project is in active development.  
Feel free to fork, contribute, or suggest improvements!

---

## 📄 License

Private development project. License to be determined.

---
