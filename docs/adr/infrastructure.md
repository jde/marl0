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
- [0009 — Local LLM Architecture for Marl0 Stack](#0009—-local-llm-architecture-for-marl0-stack)
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
## 0009 — Local LLM Architecture for Marl0 Stack


### Status
Accepted

### Context
Our Marl0 pipeline requires high availability and low latency access to a language model for processing tasks such as:
- Entity extraction
- Metadata enrichment
- Text analysis and logical reasoning

Given the frequency of use and desire for autonomy from external services, we decided to run a local instance of an LLM using [Ollama](https://ollama.ai/), a lightweight and developer-friendly LLM runtime.

Challenges identified:
- Model pulls are large and time-consuming.
- Healthchecks on Ollama container need to ensure not just service start, but model availability.
- Need for deterministic, reproducible setup flow.
- We expect future scale: swapping models, testing new models, or parallel models.
- Development flow should allow for fast iteration and easy teardown of LLM layers.

### Decision
We will:
- Use Ollama in a dedicated `local-llm` Docker container.
- Treat LLM setup as a **separate explicit initialization step** in our Makefile workflow.
- Maintain modularity by separating the LLM setup from the main application stack.
- Automate model pulling via Make targets, e.g., `make pull-llm-model MODEL_NAME=tinyllama`.
- Explicitly include healthcheck verification before starting dependent services.
- Use the lightweight model `tinyllama` for dev environment fast feedback loops.
- Optimize Docker healthcheck to use `wget` for lowest dependency footprint inside the container.
- Leave room to scale or swap to GPU-enabled models in the future.

### Alternatives Considered
1. **Inline LLM boot with app stack**
   - ✅ Simpler UX.
   - ❌ Heavy coupling. Container boot latency for model download delays all services.

2. **Pre-bake models in the Docker image**
   - ✅ Fast startup.
   - ❌ Image bloat and inflexible updates (harder for experimentation).

3. **Dynamic pull in application runtime**
   - ❌ Risk of first-run errors and inconsistent dev environments.

Our approach balances reproducibility, developer ergonomics, and future scalability.

### Consequences
- Requires an explicit `make init-local-llm model=[model]` before starting full stack.
- Clean separation of concerns: LLM lifecycle is independent of application services.
- Easily extendable to multiple models or remote fallbacks.
- Supports local/offline-first workflow with optional hosted LLM fallback.
- Simple to maintain across development, CI/CD, and production environments.

### Open Questions
- Should we eventually auto-detect and pre-warm models for production?
- Should we explore image caching or volume sharing optimizations?
- Will we extend healthcheck to ensure model is not just loaded, but responsive to actual prompt?

### Notes
This ADR will be revisited once we integrate multi-model workflows or when performance profiling in production suggests optimizations.

