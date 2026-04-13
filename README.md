# GymApp POS - Desktop Sales Point Application

A comprehensive Point of Sale (POS) and membership management system built with Electron, React, and SQLite. This application is designed specifically for gyms to manage members, subscriptions, sales, and daily operations.

## Features

### 📋 Dashboard

- **Real-time Statistics**: View total members, active subscriptions, today's sales, and revenue.
- **Quick Actions**: Buttons for quick member check-in, adding new members, and accessing sales.
- **Recent Activity**: Live feed of the latest member check-ins and sales.

### 👥 Members Management

- **CRUD Operations**: Create, Read, Update, and Delete member records.
- **QR Code Generation**: Automatic QR code generation for each member.
- **Photo Upload**: Upload member photos with automatic resizing and storage.
- **Search & Filter**: Search members by name or ID.
- **Check-in History**: View detailed history of member check-ins.

### 💳 Subscriptions

- **Flexible Plans**: Support for both **Time-Based** (e.g., 1 Month) and **Session-Based** (e.g., 10 Visits) subscriptions.
- **Status Tracking**: Automatic status updates (Active, Expired, Cancelled).
- **Renewal System**: Easy renewal process that extends the subscription period.
- **Session Management**: Track remaining sessions for session-based plans.
- **Expiring Soon**: Alerts for subscriptions expiring within 7 days.

### 🛒 Sales & Products

- **Product Management**: Manage gym products (e.g., Supplements, Water) with stock tracking.
- **POS Interface**: Fast checkout process for selling products.
- **Batch Sales**: Sell multiple products in a single transaction.
- **Sales History**: Detailed log of all sales with filtering by date and payment method.

### 🔐 Access Control

- **Check-in System**: Scan member QR codes to grant access.
- **Validation**: Real-time validation of active subscriptions.
- **Denial Reasons**: Log reasons for denied access (e.g., Expired, No Sessions).
- **Security**: Machine ID-based licensing to prevent unauthorized use.

### 🖨️ Printing

- **Receipt Printing**: Print receipts for sales and subscription renewals.
- **Print Preview**: Built-in print dialog for easy printing.

## Tech Stack

- **Core**: [Electron](https://www.electronjs.org/) - For building the desktop application.
- **Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) - For the user interface.
- **Styling**: [Material UI (MUI)](https://mui.com/) - Component library.
- **Icons**: [Material Icons](https://fonts.google.com/icons)
- **Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Embedded SQLite database.
- **Utilities**:
  - `node-machine-id`: To generate a unique identifier for the machine.
  - `qrcode.react`: For QR code generation.
  - `html2canvas`: For capturing screenshots/prints.

## Installation

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd gym
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

## Usage

### Development Mode

Run the application in development mode with hot-reload:

```bash
npm run electron:dev
```

### Build for Production

Build the application for Windows (x64 and ia32):

```bash
npm run dist
```

The output installer will be located in the `release/` folder.

## Database

The application uses a local SQLite database file (`gym.db`) located in the `electron/` directory.

### Database Schema

The database includes the following tables:

- `members`: Stores member information.
- `plans`: Stores subscription plan details.
- `subscriptions`: Manages active and past subscriptions.
- `access_logs`: Logs all access attempts (check-ins and denials).
- `transactions`: Records all sales transactions.
- `products`: Manages inventory of products.
- `sales_history`: Logs all sales transactions.
- `equipment`: Manages gym equipment.

## License

[MIT](LICENSE)
