# infrastructure

Deployment, local development, and observability configuration.

## Structure

```
infrastructure/
├── docker/       # Docker Compose for local dev (Postgres, Redis, MinIO, Neo4j)
├── kubernetes/   # K8s manifests (production)
└── monitoring/   # Prometheus, Grafana, Loki, OpenTelemetry
```

## Phase 0 Minimum

Docker Compose with:
- PostgreSQL
- Redis
- MinIO (S3-compatible)
- Optional: observability stack stub

## Docs

[Module 27 — Observability](../../docs/modules/27-observability.md)

## Status

Not implemented — placeholder.
