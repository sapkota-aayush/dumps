# 🗑️ Dumps.online

<div align="center">

![Dumps.online Banner](https://img.shields.io/badge/Dumps.online-Live-red?style=for-the-badge)
[![PWA](https://img.shields.io/badge/PWA-Enabled-red?style=for-the-badge)](https://dumps.online)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-red?style=for-the-badge)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React-red?style=for-the-badge)](https://react.dev)

**A safe, judgment-free space for SLC students to share thoughts, frustrations, and ideas anonymously**

[Visit Live Site](https://dumps.online) • [Report Bug](https://github.com/sapkota-aayush/dumps/issues) • [Request Feature](https://github.com/sapkota-aayush/dumps/issues)

</div>

---

## 📱 Overview

**Dumps.online** is a modern, anonymous social media platform built specifically for **SLC (School Leaving Certificate) students** in Nepal. It's a Progressive Web App that allows students to share their thoughts, experiences, and ideas without revealing their identity, creating a safe space for authentic expression during this crucial phase of their academic journey.

### ✨ Key Features

- 🔒 **100% Anonymous** - No accounts, no tracking, complete privacy
- 📱 **Progressive Web App** - Install on any device, works offline
- 🎨 **Modern UI/UX** - Beautiful, responsive design optimized for mobile
- 🏷️ **Hashtag System** - Organize posts by topics (#ExamStress, #BoardPrep, etc.)
- 🖼️ **Image Support** - Upload images and GIFs (via Giphy integration)
- ⚡ **Real-time Reactions** - Express yourself with emoji reactions (👍 ❤️ 😂 😠)
- 📊 **QR Code Tracking** - Track engagement through QR code scans
- 💭 **Wild Thoughts** - Share spontaneous thoughts anonymously
- 🚀 **Lightning Fast** - Optimized for performance and speed

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18.3-red?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-red?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4-red?logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-red?logo=tailwindcss)

- **React 18.3** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Router 6** - Client-side routing
- **TanStack Query** - Powerful data synchronization
- **Vite PWA Plugin** - Progressive Web App capabilities

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-red?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-red?logo=postgresql)
![Python](https://img.shields.io/badge/Python-3.11-red?logo=python)

- **FastAPI 0.104** - High-performance Python web framework
- **SQLAlchemy 2.0** - Modern Python ORM
- **PostgreSQL** - Robust relational database
- **Uvicorn** - ASGI server for FastAPI
- **Pydantic** - Data validation using Python type annotations
- **SlowAPI** - Rate limiting middleware

### Infrastructure
![AWS](https://img.shields.io/badge/AWS-EC2_S3-red?logo=amazonaws)
![Nginx](https://img.shields.io/badge/Nginx-Proxy-red?logo=nginx)
![Cloudflare](https://img.shields.io/badge/Cloudflare-CDN-red?logo=cloudflare)

- **AWS EC2** - Cloud hosting
- **AWS S3** - Image storage and CDN
- **Nginx** - Reverse proxy and static file server
- **Cloudflare** - DNS, CDN, and DDoS protection

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Cloudflare    │  DNS, CDN, SSL, DDoS Protection
└────────┬────────┘
         │
┌────────▼────────┐
│     Nginx       │  Reverse Proxy, Static Files
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│React  │ │FastAPI│  High-Performance API
│  PWA  │ │Backend│  + Rate Limiting
└───────┘ └───┬───┘
              │
         ┌────▼────┐
         │PostgreSQL│  Optimized Queries
         └─────────┘
              │
         ┌────▼────┐
         │  AWS S3 │  Image Storage & CDN
         └─────────┘
```

---

## ⚡ Performance

- **Page Load Time**: < 2 seconds
- **API Response Time**: < 100ms (p95)
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices, SEO)
- **Concurrent Users**: Supports 1000+ simultaneous users
- **Build Size**: ~475 KB (gzipped: ~154 KB)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 14+
- AWS Account (for S3)

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/sapkota-aayush/dumps.git
cd dumps
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r ../requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and AWS credentials

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend/dumpster-dove

# Install dependencies
npm install

# Set up environment variables
# Create .env file with:
# VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📁 Project Structure

```
dumps/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/      # API endpoints
│   │   ├── core/
│   │   │   └── database.py  # Database configuration
│   │   ├── models/
│   │   │   └── models.py    # SQLAlchemy models
│   │   ├── schemas/
│   │   │   └── schemas.py   # Pydantic schemas
│   │   └── main.py          # FastAPI application
│   └── requirements.txt
├── frontend/
│   └── dumpster-dove/
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── services/    # API services
│       │   └── hooks/       # Custom React hooks
│       └── package.json
├── nginx.conf               # Nginx configuration
└── README.md
```

---

## 🔒 Security Features

- **Rate Limiting** - 20 posts/hour, 100 reactions/hour to prevent spam
- **CORS Protection** - Secure cross-origin requests
- **Input Validation** - Pydantic schemas validate all inputs
- **SQL Injection Protection** - SQLAlchemy ORM prevents SQL injection
- **XSS Protection** - React automatically escapes content
- **HTTPS Only** - SSL/TLS encryption via Cloudflare

---

## 📊 API Endpoints

### Posts
- `GET /api/posts/posts` - Get all posts (paginated)
- `GET /api/posts/hashtags/{hashtag}/posts` - Get posts by hashtag
- `POST /api/posts/create` - Create a new post
- `PATCH /api/posts/post/{id}` - Update a post
- `DELETE /api/posts/post/{id}` - Delete a post
- `POST /api/posts/post/{id}/react` - React to a post
- `POST /api/posts/upload-image` - Upload an image

### Authentication
- `POST /api/auth/generate-token` - Generate anonymous user token

### Scans
- `POST /api/scans/track` - Track QR code scan
- `GET /api/scans/count` - Get total scan count
- `POST /api/scans/wild-thought` - Submit wild thought

---

## 🌐 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📝 License

This project is private and proprietary.

---

## 👤 Author

**Aayush Sapkota**

- GitHub: [@sapkota-aayush](https://github.com/sapkota-aayush)
- Website: [dumps.online](https://dumps.online)

---

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">

**Made with ❤️ for anonymous expression and SLC students**

[![Star this repo](https://img.shields.io/github/stars/sapkota-aayush/dumps?style=social)](https://github.com/sapkota-aayush/dumps)

</div>
