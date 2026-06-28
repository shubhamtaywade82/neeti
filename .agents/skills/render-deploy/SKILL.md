---
name: render-deploy
description: Short-cuts for deploying Rails API service, tailing logs, querying production DB, and checking CPU/memory metrics on Render.
---

# Render Deploy Shortcuts

This skill provides shortcut slash commands and run guides for managing the Render deployment of the `neeti` Rails API service.

## Slash Commands / Shortcuts

### `/render-deploy`
Deploys the Rails API service (`neeti`) on Render.
- **Command:** `render deploys create srv-neeti` or trigger via Render CLI.

### `/render-logs`
Tails the live logs for the `neeti` service.
- **Command:** `render logs srv-neeti` or `render logs --follow srv-neeti`

### `/render-db-query`
Queries the production database associated with the service.
- **Command:** `render psql dbs-neeti`

### `/render-metrics`
Checks CPU and memory metrics for the Rails API service.
- **Command:** `render metrics srv-neeti` or use `render services` to view status.
