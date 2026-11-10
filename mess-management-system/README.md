# SageMess – Campus Dining Management

### Mess Management System

SageMess is a simple full-stack college project for managing a campus mess. It provides separate admin and student workspaces with a fresh sage-green interface.

### Tech Stack
- **Frontend:** React.js, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** SQLite (embedded local file database via better-sqlite3)

### Features
- Role-based admin and student login
- Student records and basic meal/payment records
- Weekly breakfast, lunch, snacks, and dinner menus
- Food feedback and complaint tracking
- Mess notices for students
- Simple dashboard statistics and CSV report export

### How to Run
1. Install Node.js (MongoDB is **not** required; SQLite runs automatically from a local file).
2. Run `npm install` in both `frontend` and `mess-management-system` directories.
3. Configure the backend `.env` file using `.env.example`.
4. Optional: run `npm run seed` in `mess-management-system` to create demo accounts.
5. Start the backend using `npm start`.
6. Start the frontend using `npm run dev`.
6. Open `http://localhost:5173` in your browser.

### Project Type
Full-Stack Web Development Lab Project

**Project workflow:** Admins publish menus, maintain student records, record meals/payments, reply to feedback, and post notices. Students view menus and notices, check their own records, and submit feedback or complaints.
