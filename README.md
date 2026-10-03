# 🌾 KisanMitra

> **A smart digital platform connecting farmers, retailers, delivery partners, and administrators in one integrated agricultural ecosystem.**

KisanMitra is a full-stack **MERN-based agricultural platform** designed to simplify the way farmers purchase agricultural products, retailers manage products and orders, delivery partners handle deliveries, and administrators monitor the entire platform.

The platform provides separate workflows for **Farmers, Retailers, Delivery Partners, and Admins**, with a centralized backend and role-based access control.

---

## 🚀 Project Overview

KisanMitra brings multiple agricultural services together in a single platform.

### 👨‍🌾 Farmers

Farmers can:

* Create and manage their accounts
* Browse agricultural products
* Search and filter products
* Add products to cart
* Place orders
* Make payments
* Track orders
* View delivery information
* Monitor order status
* Manage their profile
* Access agricultural-related services

### 🏪 Retailers

Retailers can:

* Register and manage their accounts
* Add agricultural products
* Update product information
* Manage product prices and stock
* View incoming orders
* Process orders
* Track inventory
* Manage their retailer profile

### 🚚 Delivery Partners

Delivery partners can:

* Login securely
* View assigned deliveries
* Accept delivery assignments
* Update delivery status
* Manage active deliveries
* Track delivery information
* Update their availability/status

### 👨‍💼 Administrators

Administrators have centralized control over the platform.

Admin features include:

* Dashboard
* User management
* Farmer management
* Retailer management
* Delivery partner management
* Product management
* Order management
* Delivery monitoring
* Platform statistics
* System monitoring
* Role-based access control

---

# ✨ Key Features

| Feature                | Description                                  |
| ---------------------- | -------------------------------------------- |
| 🔐 Authentication      | Secure user authentication                   |
| 👥 Role-Based Access   | Farmer, Retailer, Delivery & Admin roles     |
| 🛒 Shopping Cart       | Add, remove and manage products              |
| 📦 Order Management    | Complete order lifecycle                     |
| 💳 Payment Integration | Payment gateway support                      |
| 🚚 Delivery Tracking   | Track delivery status                        |
| 📍 Location Support    | Location-based delivery information          |
| 🏪 Product Management  | Retailers can manage products                |
| 📊 Admin Dashboard     | Centralized platform management              |
| 📱 Responsive UI       | Designed for different screen sizes          |
| 🔒 Protected Routes    | Role-based protected frontend/backend routes |
| 🗄️ MongoDB            | Persistent application data storage          |

---

# 🏗️ Technology Stack

## Frontend

* ⚛️ React
* ⚡ Vite
* 🎨 HTML5
* 🎨 CSS3
* 🟨 JavaScript
* 🔄 React-based component architecture

## Backend

* 🟢 Node.js
* 🚂 Express.js
* 🔐 Authentication & Authorization
* 🌐 REST APIs

## Database

* 🍃 MongoDB
* ODM / database integration through the Node.js backend

## Development Tools

* Visual Studio Code
* Git
* GitHub
* npm
* Nodemon

---

# 📁 Project Structure

```text
KisanMitra/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── server.js
│   │
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│   │
│   ├── .env
│   ├── .env.example
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# 🔄 Application Architecture

```text
                    ┌─────────────────────┐
                    │      KisanMitra     │
                    │     React Frontend  │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │    Express / Node   │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐     ┌───────────┐    ┌───────────┐
        │ MongoDB  │     │  Payment  │    │  External │
        │ Database │     │  Gateway  │    │ Services  │
        └──────────┘     └───────────┘    └───────────┘
```

---

# 👥 User Roles

KisanMitra uses role-based access control.

```text
                    KisanMitra
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
     Farmer          Retailer         Delivery
        │               │                │
        └───────────────┼────────────────┘
                        │
                        ▼
                      Admin
```

### Role Permissions

| Role         | Main Responsibilities                      |
| ------------ | ------------------------------------------ |
| 👨‍🌾 Farmer | Products, Cart, Orders, Payments, Tracking |
| 🏪 Retailer  | Products, Inventory, Orders                |
| 🚚 Delivery  | Assigned deliveries and delivery status    |
| 👨‍💼 Admin  | Complete platform management               |

---

# ⚙️ Requirements

Before running KisanMitra locally, make sure you have:

* Node.js
* npm
* MongoDB
* Git
* Modern web browser

Recommended:

```text
Node.js 18+
npm 9+
MongoDB 6+
```

---

# 📥 Installation

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Move into the project:

```bash
cd KisanMitra
```

---

# 🔧 Backend Setup

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create:

```text
backend/.env
```

using:

```text
backend/.env.example
```

Add your local configuration.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
node src/server.js
```

For development with Nodemon:

```bash
npm run dev
```

The backend will normally be available at:

```text
http://localhost:5000
```

---

# 🎨 Frontend Setup

Open another terminal.

Navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The Vite development server will display the local frontend URL in the terminal.

Usually:

```text
http://localhost:5173
```

---

# 🔐 Environment Variables

## Backend

Create:

```text
backend/.env
```

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

Add any additional API keys required by the enabled integrations.

## Frontend

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

> Never commit `.env` files or secret API keys to GitHub.

---

# 👤 Default Development Accounts

The development environment includes the following seeded accounts:

| Role         | Email                     | Password       |
| ------------ | ------------------------- | -------------- |
| 👨‍💼 Admin  | `admin@kisanmitra.com`    | `Password@123` |
| 👨‍🌾 Farmer | `farmer@kisanmitra.com`   | `Password@123` |
| 🏪 Retailer  | `retailer@kisanmitra.com` | `Password@123` |
| 🚚 Delivery  | `delivery@kisanmitra.com` | `Password@123` |

### Admin Login

```text
Email: admin@kisanmitra.com
Password: Password@123
```

> ⚠️ These credentials are intended for local/development use. Change them before deploying a production system.

---

# 🔑 Authentication Flow

KisanMitra uses role-based authentication.

```text
User
  │
  ▼
Login
  │
  ▼
Authentication
  │
  ▼
JWT Token
  │
  ▼
Role Verification
  │
  ├── Farmer ───────► Farmer Dashboard
  │
  ├── Retailer ─────► Retailer Dashboard
  │
  ├── Delivery ─────► Delivery Dashboard
  │
  └── Admin ────────► Admin Dashboard
```

Protected resources require valid authentication and appropriate user permissions.

---

# 🛒 Order Flow

The basic shopping and delivery workflow is:

```text
Farmer
   │
   ▼
Browse Products
   │
   ▼
Add to Cart
   │
   ▼
Place Order
   │
   ▼
Payment
   │
   ▼
Retailer Processes Order
   │
   ▼
Delivery Partner Assigned
   │
   ▼
Order Out for Delivery
   │
   ▼
Delivered
```

---

# 📊 Admin Dashboard

The Admin dashboard provides centralized visibility into the platform.

Possible administrative information includes:

* Total users
* Farmers
* Retailers
* Delivery partners
* Products
* Orders
* Revenue/payment information
* Delivery status
* Platform activity

The dashboard is designed to work with actual application/database data rather than static demonstration values.

---

# 🗄️ Database

KisanMitra uses **MongoDB** for application data.

Typical data domains include:

```text
Users
Products
Orders
Cart
Payments
Deliveries
```

The backend communicates with MongoDB through the Node.js application layer.

---

# 🌐 API Architecture

The frontend communicates with the backend through REST APIs.

General structure:

```text
Frontend
   │
   ▼
/api
   │
   ├── /auth
   ├── /users
   ├── /products
   ├── /orders
   ├── /payments
   ├── /deliveries
   └── /admin
```

The exact available endpoints depend on the current backend implementation.

---

# 🧪 Development Mode

If no MongoDB URI is configured, the application can run using the project's **in-memory development data mode**, where supported.

For persistent data and complete application functionality, configure a valid MongoDB connection through:

```env
MONGO_URI=your_mongodb_connection_string
```

---

# 🔒 Security Notes

For production deployment:

* Use strong passwords
* Generate a secure JWT secret
* Never expose private API keys
* Never commit `.env` files
* Use HTTPS
* Configure appropriate CORS policies
* Use secure authentication cookies/tokens where applicable
* Restrict database network access
* Change all development credentials
* Use production database credentials

---

# 🚀 Production Deployment

KisanMitra can be deployed using separate frontend and backend hosting.

Example architecture:

```text
                    Internet
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   Frontend Hosting          Backend Hosting
          │                         │
          │                    Express API
          │                         │
          └────────────┬────────────┘
                       │
                       ▼
                    MongoDB
```

Before deployment:

1. Configure production environment variables.
2. Configure the production MongoDB URI.
3. Configure frontend API URL.
4. Configure CORS.
5. Add required payment/API credentials.
6. Build the frontend.
7. Deploy frontend and backend.
8. Test all four user roles.

---

# 🧭 Future Enhancements

Potential future improvements include:

* 📍 Real-time delivery tracking
* 🗺️ Interactive maps
* 🤖 AI-powered crop/plant analysis
* 🌦️ Weather integration
* 📈 Advanced agricultural analytics
* 🔔 Real-time notifications
* 💬 Real-time communication
* 📱 Progressive Web App support
* 🌐 Production cloud deployment
* 📊 Advanced admin analytics

---

# 🎯 Project Goals

KisanMitra aims to provide a unified digital ecosystem where:

```text
Farmers
   ↓
Discover & Purchase
   ↓
Retailers
   ↓
Process Orders
   ↓
Delivery Partners
   ↓
Deliver Products
   ↓
Farmers
```

while administrators maintain centralized control and visibility over the complete platform.

---

# 🤝 Contributing

Contributions are welcome.

To contribute:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd KisanMitra
```

Create a feature branch:

```bash
git checkout -b feature/your-feature
```

Make your changes and commit:

```bash
git add .
git commit -m "Add: your feature"
```

Push the branch:

```bash
git push origin feature/your-feature
```

Then create a Pull Request.

---

# 📄 License

This project is currently intended for educational, development, and portfolio purposes.

Add an appropriate open-source license if you plan to distribute the project publicly.

---

# 👨‍💻 Project

## KisanMitra

**A digital agricultural ecosystem connecting farmers, retailers, delivery partners, and administrators.**

```text
🌾 Farmers
    +
🏪 Retailers
    +
🚚 Delivery Partners
    +
👨‍💼 Administrators
    =
🌱 KisanMitra
```

---

⭐ **If you find KisanMitra useful, consider giving the repository a star on GitHub!**
