# 🚀 Sub0 Hackathon - Arkiv Integration Project

Progressive escrow smart contracts with Arkiv blockchain integration for decentralized project funding and milestone-based fund release.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Smart Contract Setup](#smart-contract-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

This project implements a **progressive escrow system** for decentralized project funding on Polkadot (Rococo testnet):

- **Projects** are sponsored and stored on **Arkiv blockchain**
- **Smart contracts** deployed on **Rococo testnet** manage fund release
- **Milestones** control progressive fund release
- **AI evaluation** scores projects for credibility
- **REST API** for project and contract management

### Key Features

✅ Create and manage sponsored projects  
✅ Deploy escrow smart contracts to Rococo  
✅ Progressive fund release based on milestones  
✅ Arkiv blockchain integration for data persistence  
✅ AI project evaluation system  
✅ Real-time contract deployment monitoring  

---

## 🛠️ Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI** - REST API framework
- **SQLAlchemy** - ORM for database
- **PostgreSQL** - Database
- **Arkiv SDK** - Blockchain data storage
- **Polkadot.py** - Blockchain interaction

### Frontend
- **React 18+**
- **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Smart Contract
- **Rust** - Programming language
- **ink! 4.3.0** - Smart contract framework
- **cargo-contract 4.1.1** - Compilation tool
- **WASM** - WebAssembly target

### Blockchain
- **Polkadot Rococo** - Smart contract testnet
- **Arkiv** - Decentralized data storage

---

## 📦 Prerequisites

Before you start, make sure you have installed:

- **Python 3.11+** → [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** → [Download Node.js](https://nodejs.org/)
- **Rust 1.70+** → [Install Rust](https://rustup.rs/)
- **Git** → [Download Git](https://git-scm.com/)
- **PostgreSQL 14+** → [Download PostgreSQL](https://www.postgresql.org/download/)

### Verify Installation

```bash
# Check Python
python --version  # Should be 3.11+

# Check Node
node --version    # Should be 18+
npm --version     # Should be 9+

# Check Rust
rustc --version   # Should be 1.70+
cargo --version   # Should be 1.70+

# Check Git
git --version     # Should be 2.0+

# Check PostgreSQL
psql --version    # Should be 14+
```

---

## 📁 Project Structure

```
Sub0_data/
├── backend/                    # Backend application
│   ├── src/
│   │   ├── main.py            # Entry point
│   │   ├── routes/            # API endpoints
│   │   │   └── v1/
│   │   │       ├── arkiv.py   # Arkiv operations
│   │   │       └── escrow.py  # Smart contract deployment
│   │   ├── services/          # Business logic
│   │   │   ├── arkiv.py       # Arkiv integration
│   │   │   ├── rococo_deployer.py  # SC deployment
│   │   │   └── ...
│   │   ├── models/            # Database models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── settings/          # Configuration
│   │   └── core/              # Dependencies
│   ├── pyproject.toml         # Python dependencies
│   └── requirements.txt
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API services
│   │   ├── pages/             # Page components
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── package.json           # NPM dependencies
│   ├── vite.config.ts         # Vite configuration
│   └── tsconfig.json          # TypeScript config
│
├── smart-contract/            # Rust smart contract
│   └── funding-escrow/        # Escrow contract
│       ├── lib.rs             # Contract code
│       ├── Cargo.toml         # Rust dependencies
│       └── target/
│           └── ink/           # Compiled artifacts
│               ├── funding_escrow.wasm
│               ├── funding_escrow.contract
│               └── funding_escrow.json
│
├── .env.local                 # Local environment variables
├── .env.example               # Environment template
└── README.md                  # This file
```

---

## 🚀 Setup & Installation

### Backend Setup

#### 1. Navigate to project root
```bash
cd /path/to/Sub0_data
```

#### 2. Create Python virtual environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

#### 3. Install Python dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Key dependencies:**
```
arkiv-sdk==1.0.0a7      # Arkiv blockchain integration
fastapi==0.104.0        # REST API framework
uvicorn==0.24.0         # ASGI server
sqlalchemy==2.0.0       # Database ORM
psycopg2==2.9.0         # PostgreSQL driver
polkadot-py==0.5.0      # Polkadot blockchain
python-dotenv==1.0.0    # Environment variables
```

#### 4. Setup environment variables
```bash
# Create .env.local file
cp .env.example .env.local

# Edit .env.local with your configuration:
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/sub0_db
ARKIV_SEED_PHRASE="your seed phrase here"
ARKIV_CHAIN_ID=rococo
ROCOCO_RPC=wss://rococo-contracts-rpc.polkadot.io
```

#### 5. Setup PostgreSQL database
```bash
# Create database
createdb sub0_db

# Run migrations (if applicable)
# The app will create tables automatically on first run
```

---

### Frontend Setup

#### 1. Navigate to frontend directory
```bash
cd frontend
```

#### 2. Install Node dependencies
```bash
npm install
```

#### 3. Create environment variables
```bash
# Create .env.local
cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
EOF
```

#### 4. Build Tailwind CSS (optional, usually auto-compiled)
```bash
npm run build:css
```

---

### Smart Contract Setup

#### 1. Navigate to smart contract directory
```bash
cd smart-contract/funding-escrow
```

#### 2. Install Rust and cargo-contract
```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install cargo-contract
cargo install cargo-contract --version 4.1.1
```

#### 3. Verify installation
```bash
cargo contract --version  # Should show 4.1.1
```

---

## ▶️ Running the Application

### Option 1: Start Everything (Recommended)

#### Terminal 1 - Backend
```bash
cd /path/to/Sub0_data
source venv/bin/activate  # or activate.bat on Windows
python src/main.py
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

#### Terminal 2 - Frontend
```bash
cd /path/to/Sub0_data/frontend
npm run dev
```

Expected output:
```
VITE v5.0.0 ready in 234 ms
➜  Local:   http://localhost:5173/
```

#### Terminal 3 - Smart Contract (Monitor)
```bash
cd /path/to/Sub0_data/smart-contract/funding-escrow
cargo contract info
```

---

### Option 2: Run Components Individually

#### Backend only
```bash
cd src
python main.py
# API available at http://localhost:8000
```

#### Frontend only
```bash
cd frontend
npm run dev
# UI available at http://localhost:5173/
```

#### Smart Contract compilation
```bash
cd smart-contract/funding-escrow
cargo contract build --release
# Output: target/ink/funding_escrow.wasm (14.1 KB)
```

---

## 📚 API Documentation

### Interactive API Documentation

Once backend is running, access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Projects Management
```
GET    /api/v1/arkiv/sponsored           # List all projects
POST   /api/v1/arkiv/sponsor             # Create new project
GET    /api/v1/arkiv/sponsored/{id}      # Get project details
PUT    /api/v1/arkiv/sponsored/{id}      # Update project
```

#### Smart Contract Deployment
```
POST   /api/v1/arkiv/escrow/deploy-escrow   # Deploy contract
GET    /api/v1/arkiv/escrow-info/{id}       # Get contract info
```

#### AI Evaluation
```
POST   /api/v1/arkiv/evaluate    # Evaluate project with AI
```

### Example API Call

```bash
# Create a new sponsored project
curl -X POST "http://localhost:8000/api/v1/arkiv/sponsor" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj_001",
    "name": "My Project",
    "description": "Project description",
    "sponsor": "Sponsor Name",
    "budget": 5000.0
  }'
```

---

## 🔗 Smart Contract Deployment

### Compile Smart Contract

```bash
cd smart-contract/funding-escrow

# Build contract
cargo contract build --release

# Output files in target/ink/:
# - funding_escrow.wasm          (14.1 KB - compiled contract)
# - funding_escrow.contract      (metadata)
# - funding_escrow.json          (contract info)
```

### Deploy to Rococo Testnet

#### 1. Get ROC tokens
- Visit [Rococo Faucet](https://rococo-faucet.polkadot.io)
- Enter your account address
- Request tokens

#### 2. Deploy via API
```bash
curl -X POST "http://localhost:8000/api/v1/arkiv/escrow/deploy-escrow" \
  -H "Content-Type: application/json" \
  -d '{"project_id": 1}'
```

Response:
```json
{
  "success": true,
  "contract_address": "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGo81mwA7ujVMCSDaJ",
  "arkiv_updated": true,
  "message": "Contract deployed successfully"
}
```

#### 3. Monitor Deployment
- Check server logs for deployment progress
- Contract address appears in response
- Arkiv entity updated automatically

---

## 🐛 Troubleshooting

### Backend Issues

#### Port 8000 already in use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn src.main:app --port 8001
```

#### Database connection error
```bash
# Check PostgreSQL is running
psql -U postgres

# Verify DATABASE_URL in .env.local
# Format: postgresql+asyncpg://user:password@host:port/database

# Test connection
python -c "from sqlalchemy import create_engine; engine = create_engine(DATABASE_URL)"
```

#### Arkiv connection issues
```bash
# Verify Arkiv credentials in .env.local
# Check seed phrase format
# Ensure ARKIV_CHAIN_ID is correct

# Test Arkiv connection
curl -s https://rococo-arkiv-rpc.example.com/health
```

### Frontend Issues

#### Port 5173 already in use
```bash
# Kill process using port 5173
lsof -i :5173
kill -9 <PID>

# Or specify different port
npm run dev -- --port 3000
```

#### CORS errors
```bash
# Ensure backend CORS settings include frontend origin
# In backend: CORS_ORIGINS="http://localhost:5173"
```

#### TypeScript errors
```bash
# Rebuild TypeScript
npm run build

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Smart Contract Issues

#### Compilation errors
```bash
# Update Rust
rustup update

# Clean build
cargo contract clean
cargo contract build --release

# Check error messages carefully
```

#### WASM too large
```bash
# Already optimized to 14.1 KB
# If compilation produces larger WASM:
cargo contract build --release --profile optimized
```

---

## 📋 Development Workflow

### 1. Create a new feature
```bash
git checkout -b feature/my-feature
```

### 2. Make changes and test
```bash
# Backend tests
pytest src/tests/

# Frontend tests
npm run test
```

### 3. Commit changes
```bash
git add .
git commit -m "feat: description of feature"
```

### 4. Push and create PR
```bash
git push origin feature/my-feature
```

---

## 📞 Support & Resources

### Documentation
- [Polkadot Documentation](https://wiki.polkadot.network/)
- [ink! Smart Contracts](https://use.ink/)
- [Arkiv SDK Docs](https://docs.arkiv.io/)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)

### Useful Links
- [Rococo Testnet Explorer](https://rococo.subscan.io/)
- [Polkadot.js Apps](https://polkadot.js.org/apps/)
- [Faucet - Get ROC Tokens](https://rococo-faucet.polkadot.io/)

### Environment Setup Help
- Python: https://docs.python.org/3/
- Node.js: https://nodejs.org/en/docs/
- Rust: https://doc.rust-lang.org/
- PostgreSQL: https://www.postgresql.org/docs/

---

## 📄 License

This project is part of the Sub0 Hackathon.

---

## 👥 Contributors

Built with ❤️ for the Sub0 Hackathon

---

## 🔄 Version History

- **v1.0.0** - Initial release with Arkiv integration and smart contract deployment

---

**Last Updated:** November 16, 2025

