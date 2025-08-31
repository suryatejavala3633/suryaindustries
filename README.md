# Surya Industries - CMR Paddy Dashboard

A comprehensive rice mill management system for tracking paddy procurement, rice production, FCI consignments, stock management, and by-products sales.

## Features

- **CMR Activity Management**: Track paddy receipts, rice production, and FCI consignments
- **Stock Management**: Monitor gunny bags, FRK stock, and rexin stickers with usage logs
- **By-Products Management**: Track production yields, sales, and profitability
- **Sales & Purchases**: Complete financial management system
- **Salaries & Wages**: Payroll and labor cost management
- **Electricity Tracking**: Monitor power consumption and bills

## Firebase Deployment Instructions

### Prerequisites
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)

### Deployment Steps

1. **Login to Firebase**
   ```bash
   firebase login
   ```

2. **Initialize Firebase in your project**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Choose `dist` as your public directory
   - Configure as a single-page app: Yes
   - Don't overwrite index.html: No

3. **Update Project ID**
   - Edit `.firebaserc` file
   - Replace `"your-project-id"` with your actual Firebase project ID

4. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

### Alternative: One-Command Deployment
```bash
npm run firebase:build && npm run firebase:deploy
```

### Local Testing
```bash
npm run build
firebase serve
```

## Project Structure

```
src/
├── components/          # React components
├── data/               # Static data files
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

Key Components:
- MainApp.tsx           # Main application with navigation
- Dashboard.tsx         # Paddy tracking dashboard
- RiceProduction.tsx    # Rice production management
- FCIConsignments.tsx   # FCI delivery management
- StockManagement.tsx   # Inventory tracking with usage logs
- StreamlinedByProducts.tsx # By-products yield and sales
- SalesPurchases.tsx    # Financial management
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: Local Storage (ready for Supabase integration)
- **Deployment**: Firebase Hosting

## Data Management

The application uses local storage for data persistence. All data is automatically saved and can be exported/imported for backup purposes.

### Key Data Types
- Paddy Records
- Rice Production
- FCI Consignments
- Stock Management (Gunny, FRK, Stickers)
- By-Products (Production, Sales, Payments)
- Financial Records (Sales, Purchases, Expenses)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

© 2025 Surya Industries. All rights reserved.