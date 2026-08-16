# 📚 Furniro Wiki — Complete Project Documentation

> **Furniro** is a modern furniture e-commerce platform. This wiki covers everything — architecture, features, components, APIs, deployment, and security.

---

## Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture](#-architecture)
3. [Layout System](#-layout-system)
4. [Pages & Features](#-pages--features)
5. [Component Breakdown](#-component-breakdown)
6. [State Management](#-state-management)
7. [Backend API](#-backend-api)
8. [Database Schemas](#-database-schemas)
9. [Authentication Flow](#-authentication-flow)
10. [Security Measures](#-security-measures)
11. [Deployment Guide](#-deployment-guide)
12. [Environment Variables](#-environment-variables)
13. [Technologies Used](#-technologies-used)

---

## 🏗️ Project Overview

Furnio is a full-stack furniture e-commerce web application. Users must authenticate before accessing the main app. Once logged in, they can browse products, add items to cart/wishlist, manage their profile, and submit contact inquiries.

### Key Design Decisions
- **Auth-first flow** — The app starts at the login page. All main pages require authentication.
- **httpOnly cookies** — JWT tokens are stored in cookies (not localStorage) to prevent XSS attacks.
- **Monorepo structure** — Frontend and backend live in the same repo with a single `npm start` command.
- **Zustand for state** — Lightweight state management (4x smaller than Redux).

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client (Browser)               │
│  React 19 + Vite + Tailwind CSS + Bootstrap      │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Zustand     │  │ API Util │  │ React Router │ │
│  │ (Auth/Cart) │  │ (fetch)  │  │ (SPA Routes) │ │
│  └────────────┘  └──────────┘  └──────────────┘ │
└───────────────────────┬─────────────────────────┘
                        │ HTTP (cookies)
                        ▼
┌─────────────────────────────────────────────────┐
│               Server (Express 5)                 │
│  ┌────────┐ ┌──────┐ ┌────────────┐ ┌─────────┐│
│  │ Helmet │ │ CORS │ │ Rate Limit │ │ Morgan  ││
│  └────────┘ └──────┘ └────────────┘ └─────────┘│
│  ┌────────────────────────────────────────────┐ │
│  │ Routes → Controllers → Models → MongoDB   │ │
│  └────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────┘
                        │ Mongoose
                        ▼
┌─────────────────────────────────────────────────┐
│               MongoDB Atlas (Cloud)              │
│  Collections: users, products, contacts          │
└─────────────────────────────────────────────────┘
```

---

## 📐 Layout System

The app uses a **Layout wrapper pattern** with React Router's `<Outlet>`:

```
┌──────────────────────────────────────┐
│              Navbar                   │  ← Sticky top, auth-aware
├──────────────────────────────────────┤
│                                      │
│         Animated Page Content         │  ← Framer Motion transitions
│           (via <Outlet />)           │
│                                      │
├──────────────────────────────────────┤
│              Footer                   │  ← Links, copyright
└──────────────────────────────────────┘
```

### Layout Component (`layout/Layout.jsx`)
- Wraps all authenticated pages with Navbar + Footer
- Uses `<AnimatePresence>` and `<motion.div>` for smooth page transitions
- Shows a loading spinner (`PropagateLoader`) during route changes
- Uses `LoaderContext` to manage loading state globally

### Login/Register Pages
- These are **outside** the Layout wrapper
- Full-screen backgrounds with glassmorphism card overlay
- No Navbar/Footer visible on auth pages

---

## 📄 Pages & Features

### 🔐 Login (`/login`)
- Full-screen background image with blurred glass card
- Email + password form connected to `/api/auth/login`
- Social login buttons (Google, Facebook, Apple — UI only)
- Error message display
- Loading state during API call
- Auto-redirect to home if already authenticated
- Password visibility toggle

### 📝 Register (`/register`)
- Same design language as login
- Fields: Full Name, Email, Password, Confirm Password
- Client-side validation (password match, length)
- Server-side validation (email format, uniqueness)
- Auto-redirect to home on success

### 🏠 Home (`/`)
- **CategorySection** — Browse by furniture category
- **GallerySection** — Image gallery showcase
- **HeroSection** — Banner with call-to-action
- **InspirationSlider** — Design inspiration carousel
- **ProductGrid** — Featured products grid

### 🛍️ Shop (`/shop`)
- **Location** — Breadcrumb navigation
- **Filter** — Category and sorting options
- **CardSection** — Product cards grid
- **Quality Assurance** — Trust badges

### 🛒 Cart (`/cart`)
- Product list with quantities
- Price calculations
- Remove items
- Proceed to checkout

### 💖 Wishlist (`/wishlist`)
- Saved favorite products
- Move to cart functionality

### 📦 Single Product (`/product`)
- Product detail view
- Image gallery
- Description tabs
- Related products

### 📊 Product Comparison (`/comparison`)
- Side-by-side product comparison
- Feature comparison table

### 💳 Checkout (`/checkout`)
- Billing form
- Order summary

### 📞 Contact (`/contact`)
- Contact form (Name, Email, Subject, Message)
- Submissions stored in MongoDB
- Address and location info

### 👤 Profile (`/profile`)
- Real user data from API
- Edit name and email
- Member since date
- Logout button
- Avatar with user initial

### 🚫 404 Error
- Animated error page with Framer Motion
- Decorative furniture image
- "Go Home" button

---

## 🧩 Component Breakdown

### Shared Components
| Component | File | Purpose |
|-----------|------|---------|
| `ProtectedRoute` | `components/ProtectedRoute.jsx` | Redirects to login if not authenticated |
| `Quality_assurance` | `components/Quality_assurance.jsx` | Trust badges (shipping, guarantee, support) |
| `Location` | `components/Location.jsx` | Breadcrumb navigation |
| `Loader` | `components/Loader.jsx` | Loading spinner |

### Layout Components
| Component | File | Purpose |
|-----------|------|---------|
| `Layout` | `layout/Layout.jsx` | Page wrapper with Navbar + Footer + animations |
| `Navbar` | `layout/Navbar.jsx` | Navigation, search, cart/wishlist popups, auth buttons |
| `Footer` | `layout/Footer.jsx` | Links, copyright |

---

## 🗄️ State Management

Using **Zustand** — a minimal state management library.

### Auth Store (`useAuthStore`)
```javascript
{
  user: { id, name, email, createdAt } | null,
  isAuthenticated: boolean,
  loading: boolean,
  error: string | null,
  
  // Actions
  login(email, password)     → POST /api/auth/login
  register(name, email, pw)  → POST /api/auth/register  
  fetchProfile()             → GET /api/auth/me
  updateProfile(data)        → PUT /api/auth/profile
  logout()                   → POST /api/auth/logout
}
```

### Cart Store (`useCartStore`)
```javascript
{
  items: [{ ...product, quantity }],
  
  // Actions
  addToCart(product, qty)
  removeFromCart(productId)
  updateQuantity(productId, qty)
  clearCart()
  getTotal()       → computed
  getItemCount()   → computed
}
```

### Wishlist Store (`useWishlistStore`)
```javascript
{
  items: [product],
  
  // Actions
  addToWishlist(product)
  removeFromWishlist(productId)
  isInWishlist(productId)  → boolean
  clearWishlist()
}
```

---

## 🔌 Backend API

### Base URL
- **Development:** `http://localhost:3001`
- **Production:** Your Render URL (e.g., `https://furnio-backend.onrender.com`)

### Authentication Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/api/auth/register` | `{ name, email, password }` | `{ message, user, token }` + cookie |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ message, user, token }` + cookie |
| `POST` | `/api/auth/logout` | — | `{ message }` + clear cookie |
| `GET` | `/api/auth/me` | — (cookie) | `{ user }` |
| `PUT` | `/api/auth/profile` | `{ name?, email? }` | `{ message, user }` |

### Product Endpoints

| Method | Endpoint | Query Params | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/products` | `page, limit, category, search, sort, featured` | `{ products, pagination }` |
| `GET` | `/api/products/categories` | — | `{ categories }` |
| `GET` | `/api/products/:id` | — | `{ product }` |

### Other Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/api/contact` | `{ name, email, subject?, message }` | `{ message }` |
| `GET` | `/api/health` | — | `{ status: "ok", timestamp }` |

---

## 🗃️ Database Schemas

### User
```javascript
{
  name:      String (required, 2-50 chars)
  email:     String (required, unique, validated)
  password:  String (required, min 6, hashed, select: false)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

### Product
```javascript
{
  name:          String (required)
  description:   String (required)
  price:         Number (required, min 0)
  originalPrice: Number (optional, for discount display)
  discount:      Number (0-100, percentage)
  category:      Enum ["Living Room", "Bedroom", "Dining", "Office", "Outdoor"]
  image:         String (primary image URL)
  images:        [String] (gallery images)
  stock:         Number (default 0)
  rating:        Number (0-5)
  reviewCount:   Number
  isFeatured:    Boolean
  isNew:         Boolean
  tags:          [String]
  sku:           String (unique)
}
```

### Contact
```javascript
{
  name:      String (required)
  email:     String (required, validated)
  subject:   String (default: "General Inquiry")
  message:   String (required, max 2000 chars)
  createdAt: Date (auto)
}
```

---

## 🔐 Authentication Flow

```
┌─────────┐    1. POST /register      ┌──────────┐
│  User   │ ──────────────────────────→│  Server  │
│ Browser │    { name, email, pw }     │          │
│         │                            │ Validate │
│         │    2. Set httpOnly cookie  │ Hash pw  │
│         │ ←──────────────────────────│ Save DB  │
│         │    { user, token }         │ Sign JWT │
│         │                            └──────────┘
│         │    3. GET /me (auto)
│         │ ──────────────────────────→ (cookie sent automatically)
│         │    { user data }
│         │ ←──────────────────────────
│         │
│         │    4. POST /logout
│         │ ──────────────────────────→ (clear cookie)
└─────────┘
```

**Why httpOnly cookies?**
- Cannot be accessed via JavaScript (`document.cookie` won't show it)
- Immune to XSS attacks
- Sent automatically with every request
- Browser manages expiration

---

## 🛡️ Security Measures

| Layer | Protection | Implementation |
|-------|-----------|----------------|
| **Transport** | HTTPS | Enforced by Render/Vercel |
| **Headers** | XSS, clickjacking, MIME-sniffing | Helmet middleware |
| **Authentication** | JWT in httpOnly cookies | cookie-parser + jwt |
| **Passwords** | Hashed with bcrypt (12 rounds) | bcryptjs |
| **CORS** | Whitelist frontend only | cors middleware |
| **Rate Limiting** | 100 req/15min (20 for auth) | express-rate-limit |
| **Input Validation** | Sanitize all inputs | express-validator |
| **Body Size** | Max 10KB request body | express.json limit |
| **Source Maps** | Disabled in production | Vite build config |
| **Env Vars** | Never committed to git | .gitignore + .env.example |

---

## 🚀 Deployment Guide

### Prerequisites
- GitHub repository
- MongoDB Atlas cluster
- Render account (free)
- Vercel account (free)

### Step 1: MongoDB Atlas
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP `0.0.0.0/0` (allow all — required for Render)
5. Get your connection string

### Step 2: Deploy Backend on Render
1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** (leave empty)
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node app.js`
4. Environment Variables:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = strong random string (64+ chars)
   - `FRONTEND_URL` = your Vercel URL (set after step 3)
   - `NODE_ENV` = `production`

### Step 3: Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) → Import Project
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Environment Variables:
   - `VITE_API_URL` = your Render backend URL

### Step 4: Update CORS
Go back to Render and set `FRONTEND_URL` to your Vercel deployment URL.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/furnio` |
| `JWT_SECRET` | Secret key for JWT signing | `f8a3b7c9d2e1...` (64+ chars) |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` or Vercel URL |
| `NODE_ENV` | Environment | `development` or `production` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001` or Render URL |

---

## 🧰 Technologies Used

### Frontend
- **React 19** — UI library with new JSX transform
- **Vite 6** — Lightning-fast build tool
- **Tailwind CSS 4** — Utility-first CSS framework
- **Bootstrap 5 + React-Bootstrap** — UI component library
- **MUI Icons** — Material Design icons
- **Framer Motion** — Animation library
- **Zustand** — State management
- **React Router 7** — Client-side routing
- **Lucide React** — Icon library
- **React Icons** — Social media icons
- **React Spinners** — Loading animations

### Backend
- **Express 5** — Web framework
- **Mongoose 8** — MongoDB ODM
- **bcryptjs** — Password hashing
- **jsonwebtoken** — JWT authentication
- **Helmet** — Security headers
- **cors** — Cross-origin resource sharing
- **express-rate-limit** — Rate limiting
- **express-validator** — Input validation
- **morgan** — HTTP logging
- **cookie-parser** — Cookie handling
- **dotenv** — Environment variables

---

**Developed by Praver Jain** | MIT License
