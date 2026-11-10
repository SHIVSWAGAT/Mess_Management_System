# Mess Management System (DineDesk)

A full-stack web application built to digitize and automate hostel mess operations, student meal attendance, daily menu publishing, wallet payments, expense tracking, and administrative reporting.

---

## 🚀 Key Features

* **🔒 Role-Based Authentication:** Dedicated login flows and access controls for students and mess managers.
* **📅 Menu Management:** Dynamic publishing, updating, and viewing of daily and weekly mess menus.
* **🍲 Meal Attendance:** Tracking and logging of individual student meal check-ins and meal counts.
* **💳 Wallet & Billing System:** Student account ledgers, real-time balance tracking, and payment history.
* **📊 Administrative Analytics:** Reporting interface for auditing mess expenditures and operational metrics.
* **📢 Announcements:** Real-time broadcast board for mess notices, schedule updates, and operational rules.
* **💬 Student Feedback System:** Review and complaint submission module for continuous meal quality control.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React.js (Vite)
* **Styling:** Modular CSS3
* **HTTP Client:** Fetch API / Axios REST integration

### Backend
* **Runtime Environment:** Node.js
* **Framework:** Express.js
* **Database:** SQLite3 (`sagemess.sqlite`)

---

## 📁 Repository Structure

```text
Mess_Management_System/
├── frontend/                   # React Frontend (Vite)
│   ├── public/                 # Static branding assets and icons
│   ├── src/
│   │   ├── services/           # API integration service (api.js)
│   │   ├── App.jsx             # Main application layout and routes
│   │   ├── login.jsx           # User login and authentication
│   │   ├── Menu.jsx            # Daily and weekly menu view
│   │   ├── Meals.jsx           # Meal attendance tracking interface
│   │   ├── Payments.jsx        # Wallet balance and billing details
│   │   ├── Expenses.jsx        # Admin mess cost management
│   │   ├── Feedback.jsx        # Feedback submission page
│   │   ├── Announcements.jsx   # Public announcement board
│   │   └── Reports.jsx         # Administrative analytics & reports
│   └── package.json
│
└── mess-management-system/     # Node.js Express Backend
    ├── app/
    │   ├── database/           # SQLite database connection setup
    │   └── modules/            # Domain-driven backend modules
    │       ├── auth/           # User authentication & tokens
    │       ├── meal/           # Meal logging logic
    │       ├── menu/           # Menu CRUD handlers
    │       ├── balance/        # Student balance management
    │       ├── expense/        # Expenditure tracking
    │       └── feedback/       # Feedback handling logic
    ├── data/                   # Local SQLite storage (sagemess.sqlite)
    ├── app.js                  # Entry point for the Express server
    └── package.json
```

---

## 💻 Local Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* `npm` (Node Package Manager)

### 1. Clone the Repository
```bash
git clone [https://github.com/SHIVSWAGAT/Mess_Management_System.git](https://github.com/SHIVSWAGAT/Mess_Management_System.git)
cd Mess_Management_System
```

### 2. Start the Backend Server
```bash
# Navigate to the backend directory
cd mess-management-system

# Install required Node packages
npm install

# Start the Node.js backend server
node app.js
```
> The backend server will initialize the SQLite database and run on `http://localhost:3000`.

### 3. Start the Frontend Application
Open a new terminal tab or window:

```bash
# Navigate to the frontend directory
cd frontend

# Install required frontend packages
npm install

# Start the Vite development server
npm run dev
```
> Access the user interface at `http://localhost:5173` (or the port specified in your terminal).

---

## 📡 Core API Routes

| HTTP Method | Route Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate student or admin user |
| `GET` / `POST` | `/api/menu` | Fetch or update daily mess menu |
| `GET` / `POST` | `/api/meals` | View or mark meal attendance |
| `GET` / `POST` | `/api/balance` | Query student wallet balance or add funds |
| `GET` / `POST` | `/api/expense` | Audit or log mess raw material expenditures |
| `GET` / `POST` | `/api/feedback` | Submit or review student complaints and ratings |

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
