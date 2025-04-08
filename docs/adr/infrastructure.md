# 🧩 Architectural Decision Records — Marl0 AI Pipeline

This document captures all major architectural decisions made during the design of the Marl0 AI pipeline infrastructure.

## 📖 Table of Contents

- [0001 — Record Architecture Decisions](#0001--record-architecture-decisions)
- [0002 — Use Docker Compose for Service Orchestration](#0002--use-docker-compose-for-service-orchestration)
- [0003 — Use Makefile for Local Developer Ergonomics](#0003--use-makefile-for-local-developer-ergonomics)
- [0004 — Select Memgraph as Graph Database](#0004--select-memgraph-as-graph-database)
- [0005 — Use Kafka as Event Streaming Backbone](#0005--use-kafka-as-event-streaming-backbone)
- [0006 — Data Directory Management with .gitkeep](#0006--data-directory-management-with-gitkeep)
- [0007 — Strict Environment-Based Validation Strategy](#0007--strict-environment-based-validation-strategy)
- [0008 — No Runtime Directory Automation](#0008--no-runtime-directory-automation)

---

## 0001 — Record Architecture Decisions

### Context
This project aims for longevity, maintainability, and clarity of decision-making.
As the architecture evolves, it is essential to capture not just the *what*, but the *why* of every major decision.

### Decision
We will record architectural decisions using the ADR (Architecture Decision Record) format.

### Status
Accepted

### Consequences
- Developers and future collaborators will understand the reasoning behind technology choices.
- Decisions can be revisited with historical context.
- Improves project documentation maturity.

---

## 0002 — Use Docker Compose for Service Orchestration

### Context
The project requires multiple services (Kafka, Postgres, Redis, etc.) to work together reliably in both development and production environments.

### Decision
Use Docker Compose as the orchestration layer for multi-container management.

### Status
Accepted

### Justification
- Simplifies local development environment setup.
- Reproducible environments between dev and prod.
- Flexible for future CI/CD pipelines.
- Supported on macOS, Linux, and Docker Desktop.

### Consequences
- Developers require Docker and Docker Compose installed.
- Easy service scaling and extension.

---

## 0003 — Use Makefile for Local Developer Ergonomics

### Context
Developers need fast, simple commands to manage the stack: start, stop, rebuild, logs, etc.

### Decision
Use a Makefile to abstract common Docker Compose commands and workflows.

### Status
Accepted

### Justification
- Provides ergonomic developer commands.
- Simplifies multi-command workflows.
- Reduces human error.
- Self-documenting via `make help`.

### Consequences
- Requires `make` to be available (standard on macOS/Linux).
- Improves developer velocity.

---

## 0004 — Select Memgraph as Graph Database

### Context
The project requires real-time graph querying and potential for event-driven triggers.

### Decision
Use Memgraph as the primary graph database.

### Status
Accepted

### Justification
- Real-time performance with streaming support.
- Simple Docker-based deployment.
- Active development community and good tooling.
- Supports complex relationships for marketplace modeling.
- Future scalability toward production requirements.

### Consequences
- Learning curve for Cypher query language.
- Long-term maintenance includes monitoring for updates and changes in Memgraph tooling.

---

## 0005 — Use Kafka as Event Streaming Backbone

### Context
The system requires event-driven data flow and replayability for experiments.

### Decision
Use Apache Kafka for all streaming data pipelines.

### Status
Accepted

### Justification
- Industry-standard for event streaming.
- Supports replay of data for experiments and debugging.
- Reliable message delivery.
- Works well with the rest of the stack.

### Consequences
- Additional operational complexity.
- Requires careful partition and retention policy management at scale.

---

## 0006 — Data Directory Management with `.gitkeep`

### Context
Persistent data directories must exist for Docker bind mounts.
In production, we require strict control over where data is stored.

### Decision
Track required data directories in Git using `.gitkeep` files, while ignoring contents.

### Status
Accepted

### Justification
- Ensures directories exist in cloned repositories.
- Prevents Docker from creating unintended directories.
- Provides explicit control over data paths.

### Consequences
- Developers must manually create new directories and add `.gitkeep` when introducing new services.
- Avoids implicit or hidden automation that might confuse contributors.

---

## 0007 — Strict Environment-Based Validation Strategy

### Context
Development and production environments require different behaviors for safety and convenience.

### Decision
Validate environment files and required paths strictly:
- Fail fast in production if directories or env files are missing.
- In development, rely on Git-tracked `.gitkeep` directories.

### Status
Accepted

### Justification
- Prevents accidental production data writes to incorrect paths.
- Maintains developer-friendly experience in local environments.
- Keeps environment behavior explicit and controlled.

### Consequences
- Developers must manage environment files carefully.
- Validation requires maintenance as services grow.

---

## 0008 — No Runtime Directory Automation

### Context
Early in the project, we considered auto-creating data directories at runtime for developer convenience.

### Decision
Reject runtime directory creation. Require manual directory management via `.gitkeep`.

### Status
Accepted

### Justification
- Preserves repository as the single source of truth.
- Reduces cognitive dissonance for developers ("where did this folder come from?").
- Ensures production environments are explicit and safe.

### Consequences
- Developers must manually maintain directory structure.
- Maintains clarity over automation convenience.

---
