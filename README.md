# Ruchi Restaurant Management System V2

A comprehensive restaurant management system built with Next.js, TypeScript, and PostgreSQL. Features include menu management, order processing, delivery tracking, invoicing, and data import/export capabilities.

## 🚀 Features

### Core Features
- **Menu Management**: Full CRUD operations for menu items with categories
- **Order Management**: Create, track, and manage customer orders
- **Delivery Management**: Track delivery boys, assign orders, calculate commissions
- **Invoice Generation**: Automatic invoice generation with GST support
- **User Management**: Customers, admins, delivery boys, and salesmen
- **Delivery Locations**: Manage delivery zones with custom charges

### Advanced Features
- **Data Import/Export**: Bulk import/export of menu items, categories, and other data
- **Image Management**: Product images stored in separate images table
- **Commission Tracking**: Automatic commission calculation for delivery boys and salesmen
- **GST Support**: Multiple GST types (regular, composite, unregistered)
- **Reports**: Sales reports, outstanding reports, delivery reports
- **Expense Tracking**: Track business expenses and payouts

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: pg (node-postgres)
- **Authentication**: Custom JWT-based auth
- **File Processing**: CSV/JSON import/export

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/RuchiV2.git
cd RuchiV2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_password

# Application
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

# JWT Secret (generate a random string)
JWT_SECRET=your_jwt_secret_key_here
```

### 4. Set Up Database

#### Create Database

```bash
# Using psql
psql -U postgres
CREATE DATABASE restaurant_db;
\q
```

#### Run Migrations

```bash
# Run all migration files in order
psql -U postgres -d restaurant_db -f database/migrations/create_categories_table.sql
psql -U postgres -d restaurant_db -f database/migrations/create_images_table.sql
# ... run other migrations
```

Or use the complete schema:

```bash
psql -U postgres -d restaurant_db -f database/schema.sql
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
RuchiV2/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── admin/           # Admin-specific APIs
│   │   ├── auth/            # Authentication
│   │   ├── menu/            # Menu items
│   │   ├── orders/          # Order management
│   │   └── images/          # Image serving
│   ├── admin/               # Admin dashboard pages
│   ├── customer/            # Customer-facing pages
│   └── components/          # React components
├── database/                # Database files
│   ├── migrations/          # SQL migration files
│   ├── schema.sql           # Complete database schema
│   └── import_templates/    # Sample import templates
├── lib/                     # Utility libraries
│   └── db.ts               # Database connection pool
├── scripts/                 # Utility scripts
│   └── diagnose-import.js  # Import file validator
├── public/                  # Static assets
└── docs/                    # Documentation
```

## 🗄️ Database Schema

### Main Tables

- **users**: All user accounts (customers, admins, delivery boys, salesmen)
- **categories**: Menu item categories
- **menu_items**: Restaurant menu catalog
- **images**: Product images (separate table for optimization)
- **orders**: Customer orders with items and status
- **invoices**: Generated billing invoices
- **delivery_locations**: Delivery zones with charges
- **expenses**: Business expense tracking
- **payouts**: Staff salary and commission payouts

### Key Relationships

- `menu_items.category_id` → `categories.id`
- `menu_items.image_id` → `images.id`
- `orders.user_id` → `users.id`
- `orders.delivery_boy_id` → `users.id`
- `orders.salesman_id` → `users.id`
- `orders.delivery_location_id` → `delivery_locations.id`

## 📊 Data Import/Export

### Export Data

1. Go to **Admin Dashboard** → **Data Import/Export**
2. Select data type (Menu Items, Categories, etc.)
3. Choose format (JSON or CSV)
4. Click **Export**

### Import Data

**Important**: Always import in this order:
1. **Categories** (first)
2. **Menu Items** (second)
3. Other data types

**Steps**:
1. Go to **Admin Dashboard** → **Data Import/Export**
2. Select data type
3. Upload JSON or CSV file
4. Click **Import**

**Note**: Import may take 15-30 seconds for large datasets with images.

### Data Format

See `database/import_templates/` for sample formats.

**Categories**:
```json
{
  "name": "APPETIZERS",
  "description": "Starters and appetizers",
  "sort_order": 1
}
```

**Menu Items**:
```json
{
  "name": "MANCHOW SOUP",
  "description": "Spicy vegetable soup",
  "category_name": "SOUP VEG",
  "price": "80.00",
  "gst_rate": "5.00",
  "available": true,
  "image_data_base64": "...",
  "image_type": "image/jpeg"
}
```

## 🔐 Authentication

### Default Admin Account

- **Email**: `admin@restaurant.com`
- **Password**: `admin123`

**⚠️ Important**: Change the default password after first login!

### User Roles

- **admin**: Full access to all features
- **customer**: Place orders, view order history
- **delivery**: View assigned deliveries, update delivery status
- **salesman**: Create orders, view commission reports

### Google OAuth Setup (Optional)

Enable "Sign in with Google" functionality:

1. **Quick Setup**: See [`GOOGLE_OAUTH_QUICKFIX.md`](./GOOGLE_OAUTH_QUICKFIX.md) (5 minutes)
2. **Detailed Guide**: See [`GOOGLE_OAUTH_SETUP.md`](./GOOGLE_OAUTH_SETUP.md) (30 minutes)

**What you need:**
- Google Cloud Console account
- OAuth 2.0 Client ID and Secret
- Environment variables configured

## 🚀 Deployment

### 🌐 Deploy to VPS with Coolify (Recommended)

**Complete deployment guide for 2GB RAM VPS with Coolify and Stalwart Mail Server.**

#### Quick Start (2-3 hours)
1. **Read**: [`DEPLOYMENT_README.md`](./DEPLOYMENT_README.md) - Start here!
2. **Follow**: [`DEPLOYMENT_QUICKSTART.md`](./DEPLOYMENT_QUICKSTART.md) - Step-by-step commands
3. **Track**: [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) - Don't miss anything
4. **Reference**: [`TROUBLESHOOTING_VPS.md`](./TROUBLESHOOTING_VPS.md) - Fix issues

#### Deployment Documentation

| Document | Purpose | Time | Best For |
|----------|---------|------|----------|
| [DEPLOYMENT_README.md](./DEPLOYMENT_README.md) | Master index & guide | 30 min read | Understanding the process |
| [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) | Quick deployment | 2-3 hours | Fast deployment |
| [DEPLOYMENT_VPS_COOLIFY.md](./DEPLOYMENT_VPS_COOLIFY.md) | Detailed guide | Reference | Deep understanding |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Progress tracker | Throughout | Staying organized |
| [TROUBLESHOOTING_VPS.md](./TROUBLESHOOTING_VPS.md) | Problem solving | As needed | Fixing issues |

#### What You'll Deploy
- ✅ **Coolify** - Self-hosted deployment platform
- ✅ **Stalwart Mail Server** - Email functionality
- ✅ **PostgreSQL** - Database
- ✅ **Your App** - Ruchi Restaurant with SSL

#### Requirements
- VPS with 2 Core CPU, 2GB RAM
- Ubuntu 22.04/24.04 LTS
- Domain name
- 2-3 hours for first deployment

#### Cost Estimate
- VPS: $5-10/month
- Domain: $10-15/year
- **Total: ~$70-130/year**

---

### ☁️ Deploy to Vercel (Alternative)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

**Note**: You'll need a separate database (Supabase, Railway, etc.)

---

### 🐳 Deploy with Docker (Advanced)

See `DEPLOYMENT_VPS_COOLIFY.md` for Docker-based deployment options.

## 📝 API Documentation

### Menu Items

- `GET /api/menu` - Get all menu items
- `GET /api/menu/[id]` - Get single menu item
- `POST /api/menu` - Create menu item (admin)
- `PUT /api/menu/[id]` - Update menu item (admin)
- `DELETE /api/menu/[id]` - Delete menu item (admin)

### Orders

- `GET /api/orders` - Get all orders
- `GET /api/orders/[id]` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/[id]` - Update order status

### Images

- `GET /api/images/[id]` - Get image by ID
- `POST /api/images` - Upload image

See API routes in `app/api/` for complete documentation.

## 🐛 Troubleshooting

### Database Connection Timeout

If imports fail with timeout error:
- Check `lib/db.ts` timeout settings
- Ensure PostgreSQL is running
- Check database connection credentials

### Images Not Showing

- Verify images are in the `images` table
- Check `menu_items.image_id` references
- Re-export and re-import data

### Import Fails

- Check import order (Categories → Menu Items)
- Validate file format with `scripts/diagnose-import.js`
- Check server console for detailed errors

## 📚 Documentation

- `DATA_IMPORT_EXPORT_GUIDE.md` - Complete import/export guide
- `IMAGES_ARCHITECTURE_FIXED.md` - Image storage architecture
- `TRANSACTION_ABORT_FIXED.md` - Transaction handling details
- `DATABASE_TIMEOUT_FIXED.md` - Database timeout configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- PostgreSQL community
- All contributors

## 📞 Support

For support, email support@ruchi.com or open an issue on GitHub.

---

**Version**: 2.0  
**Last Updated**: December 12, 2025  
**Status**: Production Ready ✅
