# BiteFlow - Offline Restaurant Management System & POS

An **Offline-First Restaurant POS & Management System** built with **React.js, TailwindCSS, Node.js, Express, and MongoDB Local**. It works completely without internet access, storing all data locally and providing role-based experiences for **Admin** and **Cashier** staff.

---

## 🚀 Quick Start (Offline)

### Pre-requisites
- **Node.js** (v18+)
- **MongoDB** Community Server running locally on `localhost:27017`

### 1. Launch with Single Click
Double click [`start-pos.bat`](./start-pos.bat) in the project folder. It will start the server and automatically open the application at:
```
http://localhost:5000
```

### 2. Default Login Credentials

| Role | Username | Password | Default Capabilities |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full access to Dashboard, POS, Orders, Tables, Menu, Stock, Reports, Users, Settings, Database Backup/Restore |
| **Cashier** | `cashier1` | `cashier123` | Fast POS Terminal, Orders & Bill Settlement, Table Seating Status, Menu Dish Availability |

---

## 📦 Key System Modules

### 1. POS Terminal (Point of Sale)
- **Fast Visual Menu Catalog**: Filter by categories (Burgers, Pizzas, Main Grills, Starters, Drinks, Desserts), search by dish name or item code/SKU.
- **Order Types**: Toggle between **Dine-In** (assigning table) and **Takeaway / Pickup**.
- **Dynamic Order Cart**: Item quantities, custom order notes (e.g. *"No onions"*, *"Extra sauce"*), discount percentage presets (0%, 5%, 10%, 15%, 20%), automatic tax calculation.
- **Immediate Checkout Modal**: Fast cash presets ($10, $20, $50, $100, Exact), real-time change due calculator, card & mobile wallet methods.
- **Thermal Receipt Printing**: Instant print preview formatted for standard 80mm/58mm thermal POS printers.
- **Send to Kitchen / Hold Order**: Save open dine-in tickets linked to restaurant tables.

### 2. Dashboard (Admin Analytics)
- Today's Total Sales & Revenue KPIs
- Gross Profit estimation (Net Revenue - COGS)
- Total Orders & Average Ticket size
- Live Table Occupancy percentage
- Real-time Low-Stock alert widgets
- Top-5 Best-Selling dishes ranking
- Live Recent Transactions feed

### 3. Orders Management & Bill Settlement
- Filter by status: **All**, **Pending**, **Completed**, **Dine-In**, **Takeaway**, **Cancelled**.
- Settle open bills with tender calculator.
- Update order lifecycle: `Pending` ➔ `Completed`.
- Cancel Order with mandatory reason recording (automatically restores items back to inventory stock and frees occupied tables).
- View and reprint receipts anytime.

### 4. Table & Floor Plan Management
- Visual table cards with seating capacity (2, 4, 6, 8 pax, VIP booths, Patio).
- Color-coded status: **Available (Green)**, **Occupied (Red)**, **Reserved (Amber)**.
- Link active orders directly to tables and auto-release upon payment settlement.
- Admin table management: Add, Edit, Delete tables.

### 5. Menu & Category Management
- Manage food categories with icons and color themes.
- Add / Edit / Delete menu items with selling price, cost price (for profit calculations), stock quantity, low-stock threshold, and emoji icons.
- Instant availability toggle switch (*Available / Unavailable*).

### 6. Inventory & Stock Tracking
- Real-time stock counters (Total Products, Low Stock Warning items, Sold Out items, Total Inventory Value).
- **Automated stock deduction** on every POS sale.
- One-click **+ Restock** modal for receiving supplies.
- Manual stock count adjustment modal.
- Complete **Audit Movement Log** tracking every sale, restock, cancellation refund, and manual shift with staff timestamp.

### 7. Financial Reports & Export
- Sales performance breakdown by period: **Today**, **Yesterday**, **Last 7 Days**, **This Month**, or **Custom Date Range**.
- Financial Metrics: Gross Sales, Net Revenue, Discounts, Tax Collected, COGS, Gross Profit.
- Cashier Staff Performance ranking (orders closed and revenue per cashier).
- Cancelled orders audit log.
- **One-click Export to CSV** file.
- Print-ready summary report.

### 8. User Management (Admin Only)
- Create new Cashier or Admin staff accounts.
- Edit user details & reset passwords.
- Deactivate / Activate accounts with instant login blocking.
- Self-deletion protection for logged-in admin.

### 9. Settings & Database Backup/Restore (Admin Only)
- Restaurant branding: Name, Tagline, Address, Phone, Email.
- Financial settings: Currency Symbol ($, €, £, etc.), Tax Rate %, Enable/Disable Tax.
- Custom receipt footer message.
- **100% Offline Database Backup**: Download full JSON snapshot.
- **Database Restore**: Restore backup files with confirmation safeguards.

---

## 🛠️ Technology Stack
- **Frontend**: React.js 18, TailwindCSS, Lucide Icons, Axios, Vite
- **Backend**: Node.js, Express.js, JSON Web Tokens (JWT), BCrypt.js
- **Database**: MongoDB (Local Instance `mongodb://127.0.0.1:27017/restaurant_pos`) with Mongoose ORM
- **Offline Protocol**: Zero external cloud dependencies; bundled local assets and local database engine.
