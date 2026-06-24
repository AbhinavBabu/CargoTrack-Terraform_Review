# CargoTrack

A shipment tracking and logistics platform built as a Cloud Architecture Capstone Project.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT
- **Containerization**: Docker & Docker Compose
- **Infrastructure as Code**: Terraform
- **Cloud Provider**: AWS
- **API Docs**: Swagger

## Quick Start

### Prerequisites

- Docker and Docker Compose installed

### Run

```bash
# 1. Clone the repository
git clone <repo-url> && cd cargotracker-v2

# 2. Copy environment file (optional - defaults work out of the box)
cp .env.example .env

# 3. Start the application
docker compose up -d --build
```

### Access

| Service | URL |
|---------|-----|
| Application | http://localhost |
| API | http://localhost:4000 |
| API Docs (Swagger) | http://localhost:4000/api/docs |
| Health Check | http://localhost:4000/api/health |

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| User | user@cargotrack.com | user123 |
| Admin | admin@cargotrack.com | admin123 |

## Features

### User Features
- Create, view, edit, and cancel shipments
- Track shipments by tracking number (public - no login required)
- Upload shipment documents (Invoice, Shipping Label, Proof of Delivery, Customs)
- View tracking timeline with real-time status updates
- Download shipment reports (CSV)
- Profile management with avatar upload

### Admin Features
- View all shipments across the platform
- Update shipment statuses
- View shipment documents

### Shipment Statuses
```
CREATED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
                                                    → DELAYED
                                                    → CANCELLED
```

### Tracking Numbers
Auto-generated format: `CT-YYYY-XXXXXX` (e.g., `CT-2026-123456`)

## Project Structure

```
cargotracker-v2/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── index.ts
│       ├── config.ts
│       ├── middleware/
│       ├── routes/
│       ├── providers/
│       └── swagger.ts
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.tsx
        ├── api.ts
        ├── auth.tsx
        ├── components/
        └── pages/
```



## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Get profile |
| PUT | /api/auth/me | Yes | Update profile |
| POST | /api/auth/me/avatar | Yes | Upload avatar |
| GET | /api/shipments | Yes | List shipments |
| POST | /api/shipments | Yes | Create shipment |
| GET | /api/shipments/:id | Yes | Get shipment |
| PUT | /api/shipments/:id | Yes | Update shipment |
| DELETE | /api/shipments/:id | Yes | Cancel shipment |
| GET | /api/tracking/:trackingNumber | No | Public tracking |
| POST | /api/documents/shipment/:id | Yes | Upload document |
| GET | /api/documents/shipment/:id | Yes | List documents |
| GET | /api/documents/:id/download | Yes | Download document |
| GET | /api/notifications | Yes | List notifications |
| PUT | /api/notifications/:id/read | Yes | Mark as read |
| GET | /api/reports/shipment-history | Yes | Download history CSV |
| GET | /api/reports/shipment-summary | Yes | Download summary CSV |
| GET | /api/admin/shipments | Admin | List all shipments |
| PUT | /api/admin/shipments/:id/status | Admin | Update status |
| GET | /api/admin/documents/:id | Admin | View documents |
| GET | /api/health | No | Health check |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| POSTGRES_DB | cargotrack | Database name |
| POSTGRES_USER | cargotrack | Database user |
| POSTGRES_PASSWORD | cargotrack123 | Database password |
| JWT_SECRET | (set in .env) | JWT signing secret |
| JWT_EXPIRES_IN | 7d | JWT token expiry |
| NODE_ENV | production | Node environment |
| CORS_ORIGIN | * | CORS allowed origins |
| APP_PORT | 80 | Frontend port |
| API_PORT | 4000 | Backend port |
| DB_PORT | 5432 | Database port |

## Infrastructure (Terraform)

This project uses **Terraform** to provision and manage its AWS infrastructure. The infrastructure code is located in the `cargotrack-infra` directory and follows best practices for modularity, reusability, and environment separation.

### Terraform Structure

```text
cargotrack-infra/
├── bootstrap/          # Sets up the remote backend (S3 for state, DynamoDB for locks)
├── modules/            # Reusable infrastructure components
│   ├── networking/     # VPC, Subnets, Route Tables, NAT Gateways
│   ├── security/       # Security Groups
│   ├── compute/        # Auto Scaling Groups, ALBs, EC2 Instances
│   ├── database/       # RDS PostgreSQL, Secrets Manager
│   ├── storage/        # S3 buckets for documents
│   ├── monitoring/     # CloudWatch alarms and metrics
│   ├── audit/          # DynamoDB for audit logs
│   ├── eventing/       # EventBridge for event-driven architecture
│   ├── cdn/            # CloudFront distributions
│   └── endpoints/      # VPC Endpoints for private AWS service access
└── environments/       # Environment-specific deployments
    ├── dev/            # Development environment configuration
    └── prod/           # Production environment configuration
```

### Key Terraform Concepts Used

1. **Modules**: The infrastructure is broken down into functional, reusable modules (e.g., `networking`, `compute`, `database`). This encapsulates complexity and allows the same code to be reused across different environments.
2. **Environments (Workspaces/Directories)**: We use directory-based environment separation (`environments/dev`, `environments/prod`). Each environment calls the modules with specific variables (e.g., different instance sizes, VPC CIDRs) while maintaining consistent architecture.
3. **Remote State Backend**: The `bootstrap` directory configures an S3 bucket to store the Terraform state (`terraform.tfstate`) securely, and a DynamoDB table for state locking to prevent concurrent modifications when multiple developers are applying changes.
4. **Data Sources**: Terraform data sources are used to dynamically fetch information like current AWS region, available Availability Zones, and existing AMIs.
5. **Variables and Outputs**: Input variables (`variables.tf`) allow customization of modules per environment. Outputs (`outputs.tf`) are used to pass information between modules (e.g., passing the VPC ID from the networking module to the compute module).

### How to Deploy Infrastructure

1. **Bootstrap the Backend (One-time setup per AWS account):**
   ```bash
   cd cargotrack-infra/bootstrap
   terraform init
   terraform apply
   ```

2. **Deploy an Environment (e.g., Dev):**
   ```bash
   cd cargotrack-infra/environments/dev
   terraform init    # Initializes the remote backend and modules
   terraform plan    # Shows the execution plan
   terraform apply   # Provisions the infrastructure
   ```

## Stopping Local Environment

```bash
docker compose down          # Stop containers
docker compose down -v       # Stop and remove volumes (data loss!)
```
