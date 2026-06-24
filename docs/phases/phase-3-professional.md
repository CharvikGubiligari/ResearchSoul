# Phase 3 — Professional Platform

**Goal:** Enterprise-ready product with custom agents, API platform, and integrations.

## Deliverables

### Agent Marketplace
- [ ] All 12+ core agents production-hardened
- [ ] Extended agents: GitHub, Hiring, Pricing, Security, Compliance, Customer Review
- [ ] Custom agent registration (user-defined prompts + tools)
- [ ] Agent capability discovery in planner

### Presentation Generator
- [ ] Auto PPT generation from report
- [ ] Speaker notes, charts, reference slides

### Enterprise RBAC
- [ ] Fine-grained permissions (project, research, export)
- [ ] SSO (SAML/OIDC)
- [ ] Audit logs

### Public API Platform
- [ ] REST API with API keys
- [ ] Webhooks (research.completed, research.failed)
- [ ] TypeScript SDK
- [ ] MCP Server for Cursor/Claude tool use
- [ ] CLI for research submission

### Integrations
- [ ] Slack notifications
- [ ] Notion export
- [ ] Google Drive sync
- [ ] GitHub repo analysis trigger

### Admin Dashboard
- [ ] User/org management
- [ ] Cost and usage analytics
- [ ] Failure investigation
- [ ] Model and source configuration
- [ ] Feature flags

### Billing (Full)
- [ ] Stripe subscriptions
- [ ] Usage-based metering
- [ ] Invoices and credits
- [ ] Rate limits by plan

## Exit Criteria

- External developer submits research via API and receives webhook + report
- Enterprise customer uses SSO and custom RBAC
- Admin can diagnose failed research from dashboard

## Dependencies

Phase 2 complete.

## Folder Targets

| Area | Path |
|------|------|
| Admin | `apps/admin/` |
| API Platform | `apps/api/src/platform/` |
| Agent Marketplace | `packages/agents/marketplace/` |
