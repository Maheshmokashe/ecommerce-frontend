# 🛒 ECommerce Frontend

A professional **React** dashboard for managing and browsing multi-retailer product catalogs. Built as the frontend for the [ECommerce Product API](https://github.com/Maheshmokashe/ecommerce-product-api).

---

## 🚀 Live Demo
- **Frontend:** `http://localhost:3000`
- **Backend API:** [ecommerce-product-api](https://github.com/Maheshmokashe/ecommerce-product-api)

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Authentication | JWT (localStorage) |
| Styling | Inline styles (no CSS framework) |
| Search | FastAPI microservice integration |

---

## ✨ Features

### 📊 Dashboard
- Total products, categories, retailers stats
- Retailer-wise product counts, available counts, avg price with correct currency
- New Arrivals section — 8 most recent products
- Recent products table with clickable rows

### 🏪 Retailers Page
- Retailer cards with website link
- Per-retailer stats: products, available, avg price (currency-aware)
- **Delete retailer** with confirmation modal — CASCADE deletes all products
- View Products → navigates to filtered products page

### 🗂️ Categories Page
- **Hierarchical tree** — Top → Mid → Sub → Leaf levels
- Color-coded levels (blue/green/yellow/pink)
- Expand/Collapse All controls
- **Retailer filter dropdown** — see category tree per retailer
- Search categories by name
- Product count + availability bar per node
- Click any category → filters products page

### 📦 Products Page
- Product grid with images, category badge, SKU, brand, colors
- **Sale price** with strikethrough original + discount % badge
- Filters: Category, Brand, Min/Max Price, Sort
- **Bulk Select mode** — select multiple products
  - Bulk Export CSV (selected products)
  - Bulk Delete with confirmation
  - Select All filtered (e.g. select all 11,558 at once)
- **Compare Products** — side-by-side comparison up to 3 products
- **Export CSV** — all filtered products with all fields
- **Product Detail Modal** — image gallery (6 thumbnails), colors, sizes, description
- Pagination (20 per page with smart page numbers)
- URL param filtering: `/products?retailer=Westside IN&category=Western Wear`

### 🔍 Advanced Search Page
- FastAPI-powered full-text search
- Collapsible filter panel: Retailer, Brand, Color, Size, Min/Max Price, In Stock Only
- Active filter tags (each removable with ✕)
- **Infinite scroll** — loads 20 at a time as you scroll
- **Skeleton loading** — 8 card skeletons while fetching
- Sale badges, retailer/brand tags on cards
- Product Detail Modal

### 📋 Activity Log
- All XML upload history in a table
- Columns: retailer, filename, total found, loaded, skipped, success rate (progress bar), status, uploaded by, date/time
- Summary stats: total uploads, products loaded, skipped, success/failed counts

### ⏰ Feed Scheduler
- Set XML feed URL per retailer
- One-click **Refresh Feed Now** — fetches XML from URL and updates products
- Shows last refreshed timestamp
- ✅ Feed Set / ⚠️ No Feed status badge

### 🌙 Dark Mode
- Full dark mode support on all 7 pages
- Toggle in sidebar, persists during session

---

## 📁 Project Structure

```
frontend/src/
├── App.js              # Router, Layout, sidebar navigation
├── Login.js            # Two-column JWT login page
├── Dashboard.js        # Stats, retailer cards, new arrivals
├── Retailers.js        # Retailer cards with delete
├── Categories.js       # Hierarchical tree with retailer filter
├── Products.js         # Grid, filters, bulk actions, compare, modal
├── Search.js           # FastAPI search, infinite scroll, filters
├── ActivityLog.js      # Upload history table
├── FeedScheduler.js    # Feed URL management per retailer
├── api.js              # Axios instances + all API functions
└── index.css           # Animations (spin, pulse)
```

---

## 🔌 API Integration

### Django REST API (port 8000)
```javascript
export const djangoApi = axios.create({ baseURL: 'http://127.0.0.1:8000/api' });

login(data)                          // POST /token/
getProducts()                        // GET /products/
getCategories()                      // GET /categories/
getRetailers()                       // GET /retailers/
deleteRetailer(id)                   // DELETE /retailers/{id}/
bulkDeleteProducts(ids)              // POST /bulk-delete/
getUploadLogs()                      // GET /upload-logs/
getCategoryStats(retailer?)          // GET /category-stats/?retailer=
updateFeedUrl(id, feed_url)          // POST /retailers/{id}/update-feed/
refreshFeed(id)                      // POST /retailers/{id}/refresh-feed/
```

### FastAPI Search Microservice (port 8001)
```javascript
export const fastapiApi = axios.create({ baseURL: 'http://127.0.0.1:8001' });

searchProductsAdvanced(params)       // GET /search?q=&retailer=&brand=...
getSearchFilters()                   // GET /filters
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- Backend API running on port 8000
- FastAPI running on port 8001

### 1. Clone the repo
```bash
git clone https://github.com/Maheshmokashe/ecommerce-frontend.git
cd ecommerce-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the app
```bash
npm start
```

App runs at `http://localhost:3000`

### 4. Login
Use your Django superuser credentials:
- Username: `admin`
- Password: your password

---

## 🖥️ Pages Overview

| Route | Page | Description |
|---|---|---|
| `/` | Login | JWT authentication |
| `/dashboard` | Dashboard | Stats + new arrivals |
| `/retailers` | Retailers | Manage retailers |
| `/categories` | Categories | Hierarchical tree |
| `/products` | Products | Browse + bulk actions |
| `/search` | Search | Advanced search |
| `/activity-log` | Activity Log | Upload history |
| `/feed-scheduler` | Feed Scheduler | Feed URL management |

---

## 💡 Key Technical Decisions

- **No CSS framework** — all styling via inline JS objects for portability
- **JWT interceptor** — auto-attaches Bearer token to all Django API requests
- **URL param routing** — `/products?retailer=X&category=Y` enables direct linking
- **IntersectionObserver** — powers infinite scroll on Search page
- **Skeleton loading** — improves perceived performance on Search
- **update_or_create** — Feed Scheduler refreshes without duplicating

---

## 📊 Data Stats
- **real products** across multiple retailers
- **hierarchical categories**
- **Multi-currency**: ₹, £, €, ₩, $ and 20+ more
- Supports **unlimited retailers** — just upload a new XML feed

---

## 👨‍💻 Author
**Mahesh Mokashe**
- GitHub: [@Maheshmokashe](https://github.com/Maheshmokashe)
- Experience: 3.7 years at KrawlNet Technologies
