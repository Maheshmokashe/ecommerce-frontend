# 🛒 ECommerce Frontend

A professional **React JS** dashboard for managing and browsing multi-retailer product catalogs. Built as the frontend for the [ECommerce Product API](https://github.com/Maheshmokashe/ecommerce-product-api).

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
| Authentication | JWT (localStorage + Axios interceptor) |
| Charts | Recharts |
| Styling | Inline styles (no CSS framework) |
| Search | FastAPI microservice integration |

---

## ✨ Features

### 📊 Dashboard
- Total products, categories, retailers stats
- Retailer-wise product counts, available counts, avg price with correct currency symbol
- New Arrivals section — 8 most recently added products

### 🏪 Retailers Page
- Retailer cards with website link, product count, avg price (currency-aware)
- **Delete retailer** with confirmation modal — CASCADE deletes all products
- View Products → navigates to filtered products page

### 🗂️ Categories Page
- **Hierarchical tree** — Top → Mid → Sub → Leaf levels with recursive rendering
- Color-coded level borders (blue / green / yellow / pink)
- Expand / Collapse All controls
- **Retailer filter dropdown** — category tree updates per selected retailer, empty categories auto-hidden
- Search categories by name
- Product count + availability bar per node
- Click any category → navigates to filtered products page

### 📦 Products Page
- Product grid with images, category badge, SKU, brand, colors, sizes
- **Sale price** with strikethrough original + discount % badge
- Filters: Category, Brand, Min/Max Price, Sort — all client-side (instant)
- **URL param filtering** — `/products?retailer=Westside IN&category=Western Wear`
- **Bulk Select mode:**
  - Select individual or all filtered products
  - Bulk Export CSV (selected products)
  - Bulk Delete with confirmation modal
- **Compare Products** — side-by-side comparison modal for up to 3 products
- **Export CSV** — all filtered products with all fields
- **Product Detail Modal** — image gallery (up to 6 thumbnails), colors, sizes, description
- Pagination — 20 per page with smart page number controls

### 🔍 Advanced Search Page
- FastAPI-powered full-text search (name, SKU, brand)
- Collapsible filter panel: Retailer, Brand, Color, Size, Min/Max Price, In Stock Only
- Active filter tags — each removable with ✕ click
- **Infinite scroll** — loads 20 results at a time using IntersectionObserver
- **Skeleton loading** — 8 card skeletons while fetching
- Sale badges and retailer/brand tags on product cards

### 📈 Analytics Dashboard
- **4 tabs** — Products, Price, Categories, Uploads
- **Products tab:** stat cards (total, in-stock, out-of-stock, on-sale), bar chart by retailer, stock donut, top 10 brands horizontal bar, sale vs full-price donut, products uploaded over time line chart
- **Price tab:** avg/min/max price per retailer grouped bar chart, price range distribution bar chart, price summary table
- **Categories tab:** top 10 categories horizontal bar chart, availability % per category bar chart with color coding (green/yellow/red), availability details table with progress bars
- **Uploads tab:** stat cards, uploads per retailer bar chart, success rate donut, loaded vs skipped summary bar

### 📋 Activity Log
- All XML upload history in a table
- Columns: retailer, filename, total found, loaded, skipped, success rate (progress bar), status, uploaded by, date/time
- Summary stats: total uploads, products loaded, skipped, success/failed counts

### ⏰ Feed Scheduler
- Set XML feed URL per retailer
- One-click **Refresh Feed Now** — fetches XML from URL and updates products
- Shows last refreshed timestamp
- ✅ Feed Set / ⚠️ No Feed status badge per retailer

### 🌙 Dark Mode
- Full dark mode support across all 8 pages
- Toggle in sidebar, persists during session

---

## 📁 Project Structure

```
frontend/src/
├── App.js              # Router, Layout, sidebar navigation (8 routes)
├── api.js              # Axios instances + JWT interceptor + all API functions
├── Login.js            # Two-column JWT login page
├── Dashboard.js        # Stats cards, retailer summary, new arrivals
├── Retailers.js        # Retailer cards with delete confirmation
├── Categories.js       # Recursive hierarchical tree with retailer filter
├── Products.js         # Grid, filters, bulk actions, compare, modal, CSV export
├── Search.js           # FastAPI search, infinite scroll, skeleton loading
├── Analytics.js        # 4-tab analytics dashboard with Recharts charts
├── ActivityLog.js      # Upload history table with stats
├── FeedScheduler.js    # Feed URL management per retailer
└── index.css           # Animations (spin, pulse for skeleton)
```

---

## 🔌 API Integration

### Django REST API (port 8000)
```javascript
export const djangoApi = axios.create({ baseURL: 'http://127.0.0.1:8000/api' });

// JWT auto-attached to every request via interceptor
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
getAnalytics()                       // GET /analytics/
```

### FastAPI Search Microservice (port 8001)
```javascript
export const fastapiApi = axios.create({ baseURL: 'http://127.0.0.1:8001' });

searchProductsAdvanced(params)       // GET /search?q=&retailer=&brand=&color=&size=...
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
npm install recharts
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

| Route | Page | Key Feature |
|---|---|---|
| `/` | Login | JWT authentication |
| `/dashboard` | Dashboard | Stats + new arrivals |
| `/retailers` | Retailers | Cards + delete modal |
| `/categories` | Categories | Recursive expandable tree |
| `/products` | Products | Grid + bulk actions + compare |
| `/search` | Search | FastAPI + infinite scroll |
| `/analytics` | Analytics | 4 tabs + 10 Recharts charts |
| `/activity-log` | Activity Log | Upload history table |
| `/feed-scheduler` | Feed Scheduler | Feed URL + one-click refresh |

---

## 💡 Key Technical Decisions

| Decision | Reason |
|---|---|
| Axios JWT interceptor | Token auto-attached — no manual header in any component |
| Client-side filtering on Products | All products loaded once → instant filter/sort in memory |
| URL params on Products page | `/products?retailer=X` enables direct linking from other pages |
| IntersectionObserver for scroll | Native browser API for infinite scroll — no library needed |
| Skeleton loading on Search | Better perceived performance while FastAPI responds |
| Recursive renderNode in Categories | Handles unlimited depth tree without hardcoded levels |
| Recharts for Analytics | Lightweight, React-native chart library with responsive containers |
| No CSS framework | Inline JS style objects — fully portable, no build config needed |

---

## 📊 Data Stats
- **11,500+ real products** across multiple international retailers
- **150+ hierarchical categories**
- **Multi-currency**: ₹, £, €, ₩, $ and 20+ more
- Supports **unlimited retailers** — just upload a new XML feed

---

## 👨‍💻 Author
**Mahesh Mokashe**
- GitHub: [@Maheshmokashe](https://github.com/Maheshmokashe)
- LinkedIn: [linkedin.com/in/mahesh-mokashe1997](https://linkedin.com/in/mahesh-mokashe1997)
- Experience: 3.8 years at KrawlNet Technologies
