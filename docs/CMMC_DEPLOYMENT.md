# CMMC-Compliant Secure Deployment Guide

## Overview

This guide describes the **Install Mode** deployment strategy for the Shadcn-Gantt-tool, designed for organizations handling sensitive data such as Controlled Unclassified Information (CUI) and requiring CMMC (Cybersecurity Maturity Model Certification) compliance.

## Installation Modes Comparison

| Feature | Easy Mode (API Connector) | Install Mode (Secure Self-Hosted) |
|---------|---------------------------|-----------------------------------|
| **Use Case** | Demos, prototyping, public data | CUI, CMMC compliance, sensitive data |
| **Configuration** | UI-based settings editor + environment variables | Environment variables only |
| **Data Sources** | Baserow API, PostgreSQL API, CSV/JSON upload | Direct PostgreSQL connection |
| **Deployment** | Vercel, Netlify, cloud platforms | Self-hosted Docker Compose |
| **Data Location** | External API (Baserow cloud) | Local PostgreSQL database |
| **Network** | Internet-connected | Air-gapped capable |
| **Encryption** | HTTPS in transit | FIPS-compliant encryption at rest & in transit |
| **Infrastructure** | Minimal (serverless) | Full stack (database + app + Baserow) |
| **Setup Time** | 5-10 minutes | 1-2 hours |
| **Maintenance** | Low (managed services) | Medium (self-managed) |

## Architecture

### Install Mode Architecture

```
┌─────────────────────────────────────────────────────┐
│            Secure Windows Enclave                    │
│                 (BitLocker Encrypted)                │
│                                                      │
│  ┌──────────────┐      ┌──────────────┐            │
│  │   Browser    │──────▶│  Gantt App   │            │
│  │  (localhost) │◀──────│  (Next.js)   │            │
│  └──────────────┘      └───────┬──────┘            │
│                                 │                    │
│                                 │ TLS (internal)    │
│                                 ▼                    │
│                        ┌──────────────┐             │
│                        │  PostgreSQL  │             │
│                        │   Database   │             │
│                        │ (FIPS-140-2) │             │
│                        └───────┬──────┘             │
│                                 │                    │
│                                 │ TLS (internal)    │
│                                 ▼                    │
│                        ┌──────────────┐             │
│                        │   Baserow    │             │
│                        │  (Optional)  │             │
│                        └──────────────┘             │
│                                                      │
└─────────────────────────────────────────────────────┘
           ▲
           │ No external network access
           │ (Air-gapped deployment)
```

### Key Components

1. **PostgreSQL Database**: FIPS-compliant PostgreSQL instance for data storage
2. **Gantt Application**: Next.js application with PostgreSQL provider
3. **Baserow (Optional)**: Self-hosted Baserow instance for UI-based data management
4. **Docker Network**: Isolated internal network for secure inter-container communication
5. **BitLocker Encryption**: Windows disk encryption for data at rest

## CMMC Requirements Addressed

### Access Control (AC)
- All services run in isolated Docker containers
- No external network exposure (localhost only)
- Database credentials never leave the server environment

### System and Communications Protection (SC)
- TLS 1.3 for all inter-container communication
- FIPS-compliant encryption algorithms
- Encrypted data at rest via BitLocker

### System and Information Integrity (SI)
- Docker container integrity verification
- No external dependencies at runtime
- Immutable infrastructure approach

### Media Protection (MP)
- BitLocker full-disk encryption for data at rest
- Encrypted PostgreSQL data files
- Secure container volumes

## Prerequisites

### System Requirements

- **Operating System**: Windows 10/11 Pro or Windows Server 2019+
- **BitLocker**: Enabled and configured
- **Docker Desktop**: Latest version with WSL2 backend
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: 20GB minimum for containers and data
- **CPU**: 4+ cores recommended

### Required Software

1. **Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop
   - Enable WSL2 integration
   - Configure to start on login

2. **BitLocker**
   - Enable via Windows Security settings
   - Use TPM + PIN for maximum security
   - Backup recovery keys securely

3. **Git** (for initial setup only)
   - Download from: https://git-scm.com/download/win

## Installation Steps

### Phase 1: Environment Setup

#### 1.1 Enable BitLocker

```powershell
# Check BitLocker status
manage-bde -status C:

# Enable BitLocker (if not already enabled)
# Use Windows Settings > Update & Security > Device Encryption
# Or for Pro/Enterprise:
# Control Panel > BitLocker Drive Encryption
```

#### 1.2 Install Docker Desktop

1. Download Docker Desktop from the official website
2. Install with default settings
3. Enable WSL2 integration during setup
4. Restart your computer

#### 1.3 Verify Docker Installation

```powershell
docker --version
docker-compose --version
```

### Phase 2: Application Setup

#### 2.1 Clone the Repository (One-Time Setup)

```bash
git clone https://github.com/Llompi/Shadcn-Gantt-tool.git
cd Shadcn-Gantt-tool
```

**Note**: After initial setup, the repository can be transferred to the air-gapped environment via secure media if required.

#### 2.2 Create Docker Compose Configuration

Create a file named `docker-compose.secure.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine  # Use FIPS-compliant image in production
    container_name: gantt-postgres
    environment:
      POSTGRES_DB: gantt_db
      POSTGRES_USER: gantt_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      # Enable FIPS mode (when using FIPS-compliant image)
      # POSTGRES_INITDB_ARGS: "--data-checksums"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - gantt_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gantt_user -d gantt_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  baserow:
    image: baserow/baserow:latest
    container_name: gantt-baserow
    environment:
      BASEROW_PUBLIC_URL: http://localhost:8000
      DATABASE_TYPE: postgresql
      DATABASE_NAME: baserow_db
      DATABASE_USER: gantt_user
      DATABASE_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      SECRET_KEY: ${BASEROW_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8000:80"
    volumes:
      - baserow_data:/baserow/data
    networks:
      - gantt_network
    restart: unless-stopped

  gantt-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: gantt-app
    environment:
      NODE_ENV: production
      DATA_PROVIDER: postgresql
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: gantt_db
      POSTGRES_USER: gantt_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      # Optional: Connect to Baserow for UI-based management
      BASEROW_BASE_URL: http://baserow
      BASEROW_TOKEN: ${BASEROW_TOKEN}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:3000"
    networks:
      - gantt_network
    restart: unless-stopped

networks:
  gantt_network:
    driver: bridge
    internal: true  # Prevents external network access

volumes:
  postgres_data:
    driver: local
  baserow_data:
    driver: local
```

#### 2.3 Create Environment Variables File

Create a file named `.env.secure`:

```env
# PostgreSQL Configuration
POSTGRES_PASSWORD=<GENERATE_STRONG_PASSWORD>

# Baserow Configuration
BASEROW_SECRET_KEY=<GENERATE_SECRET_KEY>
BASEROW_TOKEN=<WILL_BE_GENERATED_AFTER_SETUP>

# Data Provider
DATA_PROVIDER=postgresql
```

**Security Note**: Generate strong passwords using:
```powershell
# PowerShell command to generate secure password
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

#### 2.4 Create Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Phase 3: PostgreSQL Provider Implementation

**Status**: In Development (High Priority)

The PostgreSQL provider will implement the `IDataProvider` interface to allow direct database connections without external APIs.

Planned structure:
```
lib/
  providers/
    postgresql/
      postgres-provider.ts      # Main provider implementation
      db-client.ts              # PostgreSQL client wrapper
      field-mapping.ts          # Database schema mapping
      migrations/               # Database schema migrations
        001_initial_schema.sql
```

**Current Workaround**: Until the PostgreSQL provider is complete, you can use Baserow connected to the PostgreSQL backend.

### Phase 4: Deployment

#### 4.1 Build and Start Services

```bash
# Load environment variables
export $(cat .env.secure | xargs)

# Build and start all services
docker-compose -f docker-compose.secure.yml up -d

# View logs
docker-compose -f docker-compose.secure.yml logs -f
```

#### 4.2 Verify Deployment

```bash
# Check service health
docker-compose -f docker-compose.secure.yml ps

# Verify PostgreSQL
docker exec gantt-postgres pg_isready -U gantt_user -d gantt_db

# Verify network isolation
docker network inspect gantt_network
```

#### 4.3 Access the Application

1. **Gantt Application**: http://localhost:3000
2. **Baserow Admin UI**: http://localhost:8000 (optional)

### Phase 5: Database Initialization

#### 5.1 Create Initial Schema (Manual - Until Migrations Implemented)

```bash
# Connect to PostgreSQL
docker exec -it gantt-postgres psql -U gantt_user -d gantt_db

# Create tables (example schema)
CREATE TABLE statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status_id INTEGER REFERENCES statuses(id),
    group_name VARCHAR(255),
    owner VARCHAR(255),
    description TEXT,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# Create indexes
CREATE INDEX idx_tasks_status ON tasks(status_id);
CREATE INDEX idx_tasks_dates ON tasks(start_date, end_date);
```

## Security Hardening

### Network Isolation

The Docker Compose configuration uses an internal network that prevents external access:

```yaml
networks:
  gantt_network:
    internal: true  # No external connectivity
```

### TLS Configuration (Future Enhancement)

For production deployments, configure TLS between services:

1. Generate self-signed certificates within the enclave
2. Configure PostgreSQL to require SSL
3. Update connection strings to use SSL

### Access Control

1. **Limit PostgreSQL Access**: Only accessible within Docker network
2. **Strong Passwords**: Use generated passwords (32+ characters)
3. **No External Ports**: Except localhost-bound ports
4. **Container Isolation**: Each service runs in isolated container

### Audit Logging

Enable PostgreSQL audit logging:

```sql
-- Enable logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
SELECT pg_reload_conf();
```

## Backup and Recovery

### Database Backups

```bash
# Create backup
docker exec gantt-postgres pg_dump -U gantt_user gantt_db > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i gantt-postgres psql -U gantt_user gantt_db < backup_20250101.sql
```

### Volume Backups

```bash
# Backup all data volumes
docker run --rm \
  -v gantt_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_data_backup.tar.gz /data
```

### BitLocker Recovery

Ensure BitLocker recovery keys are stored securely:
- Print and store in physical safe
- Store in enterprise key management system
- Document recovery procedures

## Maintenance

### Updates and Patches

```bash
# Stop services
docker-compose -f docker-compose.secure.yml down

# Pull updated images
docker-compose -f docker-compose.secure.yml pull

# Rebuild application
docker-compose -f docker-compose.secure.yml build gantt-app

# Start services
docker-compose -f docker-compose.secure.yml up -d
```

### Monitoring

```bash
# View logs
docker-compose -f docker-compose.secure.yml logs -f

# Monitor resource usage
docker stats

# Check disk usage
docker system df
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.secure.yml logs

# Verify environment variables
docker-compose -f docker-compose.secure.yml config

# Check network
docker network ls
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker exec gantt-postgres pg_isready

# Check connection from app container
docker exec gantt-app nc -zv postgres 5432

# View PostgreSQL logs
docker logs gantt-postgres
```

### BitLocker Issues

- Verify TPM is enabled in BIOS
- Check BitLocker status: `manage-bde -status C:`
- Ensure recovery key is accessible

## FIPS Compliance

### Current Status

The default configuration uses standard Alpine-based images. For full FIPS compliance:

### FIPS-Compliant PostgreSQL

Replace the standard PostgreSQL image with a FIPS-compliant build:

```yaml
postgres:
  image: <fips-compliant-postgres-image>
  # Or build from source with FIPS-enabled OpenSSL
```

### FIPS-Compliant Node.js

Use a FIPS-enabled Node.js image:

```dockerfile
FROM <fips-compliant-node-image> AS base
```

### Verification

```bash
# Verify OpenSSL FIPS mode (in container)
docker exec gantt-postgres openssl version
# Should show FIPS-enabled version

# Verify Node.js crypto
docker exec gantt-app node -p "crypto.getFips()"
# Should return 1 if FIPS mode is enabled
```

## Compliance Checklist

- [ ] BitLocker enabled on host system
- [ ] Docker containers running in isolated network
- [ ] Strong passwords configured (32+ characters)
- [ ] No external network access (air-gapped or firewalled)
- [ ] Audit logging enabled in PostgreSQL
- [ ] Regular backups scheduled
- [ ] Recovery procedures documented
- [ ] FIPS-compliant images deployed (if required)
- [ ] TLS configured for inter-service communication
- [ ] Access controls documented and enforced

## Future Enhancements

### Planned Features

1. **Automated PostgreSQL Provider**: Complete implementation of direct PostgreSQL connectivity
2. **Database Migrations**: Automated schema versioning and migrations
3. **TLS Certificate Management**: Automated internal CA and certificate rotation
4. **Enhanced Monitoring**: Built-in metrics and alerting
5. **Backup Automation**: Scheduled automated backups with retention policies
6. **Air-Gap Installer**: Offline installation package with all dependencies

### Phase 2 Roadmap

- [ ] Complete PostgreSQL provider implementation
- [ ] Database migration system
- [ ] Internal TLS certificate authority
- [ ] Automated backup system
- [ ] Compliance reporting dashboard
- [ ] Offline installation package

## Support and Resources

### Documentation

- [Main README](../README.md)
- [Baserow Setup Guide](./BASEROW_SETUP.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

### Getting Help

For issues or questions about secure deployment:
1. Check this guide and troubleshooting section
2. Review Docker logs and system status
3. Open an issue on GitHub (for non-sensitive topics)
4. Consult CMMC compliance documentation

### Additional Resources

- [CMMC Model Overview](https://www.acq.osd.mil/cmmc/)
- [NIST SP 800-171](https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**Note**: This guide describes the target architecture for Install Mode. Some components (particularly the PostgreSQL provider) are currently in development. Check the [project roadmap](../README.md#roadmap) for implementation status.
