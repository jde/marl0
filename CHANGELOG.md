# 🧩 CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- (new features)

### Changed
- (modifications)

### Fixed
- (bug fixes)

### Removed
- (deprecations)

---

## [0.1.0] - 2025-04-08

### Added
- ✅ Initial multi-service Docker Compose stack (Kafka, Postgres, Redis, Memgraph, LanceDB, MinIO, Prometheus, Grafana)
- ✅ Environment-based data mapping with `.env.dev` and `.env.prod`
- ✅ Makefile with ergonomic developer commands:
  - Build, up, down, stop, validate
  - Service-specific builds and logs
  - Dynamic help command
- ✅ Production-safe validation of required environment files and bind-mounted data paths
- ✅ Clean local development flow with `docker_data/` directories tracked via `.gitkeep`
- ✅ Service port standardization in the `42xx` range to avoid local conflicts
- ✅ Prometheus config base and service startup
- ✅ Kafka KRaft mode production-ready config
- ✅ Clean, up-to-date `README.md` documenting project setup and decisions

### Changed
- N/A

### Fixed
- Resolved Docker context build path issues with `docker-run.sh`
- Resolved Docker build errors related to missing service Dockerfiles
- Addressed Prometheus bind-mount path validation
- Kafka container runtime config errors (process roles, node ID)

### Removed
- N/A

---

## [0.0.1] - Initial scaffold (untracked)
- Project idea and repo setup
