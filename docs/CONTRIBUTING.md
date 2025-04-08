# 🧩 Contributing to Marl0 AI Pipeline Infrastructure

Thank you for considering contributing!  
This project is designed to be **developer-friendly and production-aware** from day one.

This document explains how to work with the repository, maintain standards, and contribute effectively.

---

## 🚀 Getting Started

### Prerequisites

- Docker
- Docker Compose
- GNU Make
- (Optional) Docker Desktop for visual management

Clone the repository:
```bash
git clone <repo-url>
cd marl0
```

Make the runner script executable:
```bash
chmod +x docker-run.sh
```

Build and run:
```bash
make rebuild
```

---

## 📦 Project Principles

- **Repository is the source of truth.**  
  All data directories are tracked via `.gitkeep`.  
  Local and server environments are controlled via `.env.dev` and `.env.prod`.

- **Environment-aware validation.**  
  Production environments will fail fast if required paths are missing.  
  Development environments expect directories to exist in the repo.

- **Minimal, explicit automation.**  
  Infra should behave transparently — no "magic" folder creation at runtime.

- **Fast feedback loops.**  
  Use `make logs-<service>` for specific service logs, and `make rebuild` for full stack rebuilds.

- **Self-documenting tooling.**  
  Use `make help` to see available commands.

---

## 📂 Adding New Data Services

When adding a service that requires persistent data:

1. Create the data directory:
   ```bash
   mkdir -p docker_data/myservice
   ```

2. Add a `.gitkeep` file:
   ```bash
   touch docker_data/myservice/.gitkeep
   ```

3. Update `.env.dev` and `.env.prod` as needed.

4. Commit both the directory and `.gitkeep` to the repository.

---

## 🧩 Updating the Changelog

All changes should be documented in `CHANGELOG.md`.

Follow the template:
```
## [X.Y.Z] - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...
```

Commit your updates along with your changes.

---

## 📝 Development Workflow

Typical development loop:

```bash
make rebuild
make logs-app
```

For specific services:
```bash
make build-lancedb
make logs-lancedb
```

Stop the stack:
```bash
make down
```

Check environment config:
```bash
make validate
```

---

## 🚀 Next Milestones

The project is actively evolving.  
Key next steps include:
- Kafka data flow wiring
- Real-time data processing
- Observability dashboards
- Graph database ingestion
- Production deployment strategies

---

## 🤝 Contributions Welcome

Contributions, feedback, and suggestions are welcome!  
Please follow these guidelines and ensure all changes are documented.

---

## 📄 License

Private development project. License to be determined.

