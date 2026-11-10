const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db, databasePath } = require('./app/database/sqlite');
const Mess = require('./app/modules/mess/mess.model');
const User = require('./app/modules/user/user.model');
const Category = require('./app/modules/category/category.model');
const Meal = require('./app/modules/meal/meal.model');
const Expense = require('./app/modules/expense/expense.model');
const Balance = require('./app/modules/balance/balance.model');
const Menu = require('./app/modules/menu/menu.model');
const Feedback = require('./app/modules/feedback/feedback.model');
const Announcement = require('./app/modules/announcement/announcement.model');

const UserLib = require('./app/modules/user/user.lib');
const MenuLib = require('./app/modules/menu/menu.lib');
const FeedbackLib = require('./app/modules/feedback/feedback.lib');
const CategoryLib = require('./app/modules/category/category.lib');
const MealLib = require('./app/modules/meal/meal.lib');
const BalanceLib = require('./app/modules/balance/balance.lib');
const ExpenseLib = require('./app/modules/expense/expense.lib');
const MessLib = require('./app/modules/mess/mess.lib');

const secretKey = require('./config/config').development.JWTsecret;

async function runTests() {
    console.log('=== RUNNING SQLITE MIGRATION VERIFICATION TESTS ===\n');

    // 1. Database file and tables verification
    console.log('1. Verifying SQLite Database and Tables...');
    console.log(`Database path: ${databasePath}`);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    const tableNames = tables.map(t => t.name);
    console.log('Detected tables:', tableNames.join(', '));
    const expectedTables = ['announcements', 'balances', 'categories', 'expenses', 'feedback', 'meals', 'menus', 'messes', 'users'];
    for (const t of expectedTables) {
        assert(tableNames.includes(t), `Missing table: ${t}`);
    }
    console.log('✔ All 9 expected relational tables exist.\n');

    // 2. Data preservation check
    console.log('2. Checking Existing Seed Data Preservation...');
    const admin = await User.findOne({ email: 'admin@sagemess.local' });
    assert(admin, 'Admin account missing');
    assert.strictEqual(admin.role, 'admin');
    console.log(`✔ Found existing admin: ${admin.username} (${admin.email}), messId: ${admin.messId}`);

    const student = await User.findOne({ email: 'student@sagemess.local' });
    assert(student, 'Student account missing');
    assert.strictEqual(student.role, 'user');
    console.log(`✔ Found existing student: ${student.username} (${student.email}), roll: ${student.rollNumber}`);

    const messId = admin.messId;

    // 3. Authentication & Password Hashing Verification
    console.log('\n3. Testing Password Verification & JWT Token Generation...');
    const adminPassMatch = bcrypt.compareSync('sage123', admin.password);
    assert(adminPassMatch, 'Admin password bcrypt comparison failed');
    console.log('✔ Admin password verified with bcrypt');

    const studentPassMatch = bcrypt.compareSync('sage123', student.password);
    assert(studentPassMatch, 'Student password bcrypt comparison failed');
    console.log('✔ Student password verified with bcrypt');

    // Token creation and verify
    const adminToken = jwt.sign({
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        messId: admin.messId,
    }, secretKey, { expiresIn: '1d' });

    const decoded = jwt.verify(adminToken, secretKey);
    assert.strictEqual(decoded.id, admin._id);
    assert.strictEqual(decoded.role, 'admin');
    console.log('✔ JWT generation and verification functioning correctly');

    // 4. Student CRUD Operations
    console.log('\n4. Testing Student CRUD Operations...');
    const testEmail = `teststudent_${Date.now()}@sagemess.local`;
    const addStudentRes = await UserLib.addUser({
        email: testEmail,
        username: 'Test Candidate',
        password: 'password123',
        phone: '9988776655',
        rollNumber: 'TEST999',
        department: 'ECE',
        hostel: 'Hostel 3',
        roomNumber: '101',
        messId,
    });
    assert(addStudentRes.success, 'Failed to add student');
    const newStudentId = addStudentRes.data._id;
    console.log(`✔ Created student: ${addStudentRes.data.username} (_id: ${newStudentId})`);

    // Fetch user profile
    const profile = await UserLib.getProfile(newStudentId);
    assert(profile, 'Profile not found');
    assert.strictEqual(profile.password, undefined, 'Profile should exclude password');
    assert.strictEqual(profile.rollNumber, 'TEST999');
    console.log('✔ Successfully retrieved student profile (password excluded)');

    // Update student
    const updateRes = await UserLib.updateStudent(newStudentId, messId, {
        username: 'Updated Candidate',
        roomNumber: '102',
    });
    assert(updateRes.success, 'Failed to update student');
    assert.strictEqual(updateRes.data.username, 'Updated Candidate');
    assert.strictEqual(updateRes.data.roomNumber, '102');
    console.log('✔ Successfully updated student details');

    // Delete student
    const removeRes = await UserLib.removeUser(newStudentId, messId);
    assert(removeRes.success, 'Failed to remove student');
    const checkDeleted = await User.findById(newStudentId);
    assert(!checkDeleted, 'Student should be deleted');
    console.log('✔ Successfully deleted student');

    // 5. Menu Management Operations
    console.log('\n5. Testing Menu Management Operations...');
    const weeklyMenu = await MenuLib.getWeeklyMenu(messId);
    console.log(`✔ Fetched weekly menu (${weeklyMenu.length} days configured)`);

    // Add a Tuesday menu if not exists, or update
    let tuesday = await Menu.findOne({ messId, day: 'Tuesday' });
    if (!tuesday) {
        const addMenuRes = await MenuLib.addMenu(messId, admin._id, {
            day: 'Tuesday',
            breakfast: ['Idli', 'Sambar', 'Filter Coffee'],
            lunch: ['Rice', 'Dal Tadka', 'Aloo Gobi'],
            snacks: ['Biscuits', 'Tea'],
            dinner: ['Chapati', 'Paneer Butter Masala', 'Salad'],
            specialNote: 'Chef special dinner',
            isSpecialDay: true,
        });
        assert(addMenuRes.success, 'Failed to add Tuesday menu');
        tuesday = addMenuRes.data;
        console.log('✔ Created Tuesday menu');
    }

    // Verify Tuesday menu array deserialization
    assert(Array.isArray(tuesday.breakfast), 'Breakfast should be parsed as array');
    assert.strictEqual(tuesday.breakfast[0], 'Idli');
    assert.strictEqual(Boolean(tuesday.isSpecialDay), true);
    console.log('✔ JSON array fields (breakfast, lunch, snacks, dinner) correctly deserialized');

    // Update menu
    const updateMenuRes = await MenuLib.updateMenu(messId, tuesday._id, admin._id, {
        specialNote: 'Updated special note for Tuesday',
    });
    assert(updateMenuRes.success, 'Failed to update menu');
    console.log('✔ Updated Tuesday menu note');

    // 6. Feedback & Complaints Operations
    console.log('\n6. Testing Feedback & Complaints...');
    const newFeedback = await FeedbackLib.addFeedback({
        userId: student._id,
        messId,
        type: 'Feedback',
        category: 'Food Quality',
        subject: 'Great dinner tonight',
        description: 'The paneer was fresh and hot.',
        rating: 4.5,
    });
    assert(newFeedback && newFeedback._id, 'Failed to create feedback');
    console.log(`✔ Feedback submitted (_id: ${newFeedback._id})`);

    // Get feedback stats
    const stats = await FeedbackLib.getFeedbackStats(messId);
    assert(typeof stats.total === 'number' && stats.total >= 1, 'Invalid feedback stats');
    console.log(`✔ Feedback stats loaded: total=${stats.total}, avgRating=${stats.averageRating}`);

    // Update feedback by admin
    const updateFb = await FeedbackLib.updateFeedback(newFeedback._id, messId, {
        status: 'Resolved',
        adminResponse: 'Thank you for the appreciation!',
    });
    assert(updateFb.status === 'Resolved');
    assert.strictEqual(updateFb.adminResponse, 'Thank you for the appreciation!');
    console.log('✔ Feedback status and admin response updated');

    // Clean up test feedback
    await FeedbackLib.deleteFeedback(newFeedback._id, messId);
    console.log('✔ Test feedback cleaned up');

    // 7. Announcement / Notices Operations
    console.log('\n7. Testing Announcements / Notices...');
    const notices = await Announcement.find({ messId }).sort({ createdAt: -1 });
    console.log(`✔ Loaded ${notices.length} existing notices`);
    const testNotice = await Announcement.create({
        messId,
        title: 'Water Maintenance Notice',
        message: 'Water purifier maintenance scheduled from 3 PM to 5 PM today.',
        createdBy: admin._id,
    });
    assert(testNotice && testNotice._id, 'Failed to create notice');
    console.log(`✔ Notice created (_id: ${testNotice._id})`);

    const deletedNotice = await Announcement.findOneAndDelete({ _id: testNotice._id, messId });
    assert(deletedNotice, 'Failed to delete notice');
    console.log('✔ Notice deleted successfully');

    // 8. Categories, Meals, Balances, Expenses, and Dashboard
    console.log('\n8. Testing Category, Meal, Balance, Expense, and Summary Reports...');
    // Create a meal category if none
    let mealCat = await Category.findOne({ $and: [{ isMeal: 1 }, { messId }] });
    if (!mealCat) {
        const catRes = await CategoryLib.addCategory({
            name: 'Daily Meal Deposit',
            messId,
            isMeal: 1,
        });
        mealCat = catRes.data;
        console.log(`✔ Created Meal category: ${mealCat.name}`);
    } else {
        console.log(`✔ Existing Meal category found: ${mealCat.name}`);
    }

    // Add test balance
    const testBalance = await Balance.create({
        userId: student._id,
        categoryId: mealCat._id,
        messId,
        amount: 2500,
        date: new Date().toISOString(),
    });
    assert(testBalance, 'Failed to record balance');
    console.log(`✔ Balance record created: Rs. ${testBalance.amount}`);

    // Add test meal
    const testMeal = await Meal.create({
        userId: student._id,
        messId,
        numberOfMeal: 2,
        date: new Date().toISOString(),
    });
    assert(testMeal, 'Failed to record meal');
    console.log(`✔ Meal record created: ${testMeal.numberOfMeal} meals`);

    // Add test expense
    const testExpense = await Expense.create({
        amount: 800,
        date: new Date().toISOString(),
        summary: 'Vegetables and dairy purchase',
        categoryId: mealCat._id,
        userId: admin._id,
        messId,
    });
    assert(testExpense, 'Failed to record expense');
    console.log(`✔ Expense record created: Rs. ${testExpense.amount}`);

    // Summary calculations
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const messSummary = await MessLib.messSummary(start, end, messId);
    console.log('✔ Mess Summary calculated:', messSummary);
    assert(typeof messSummary.totalMeals === 'number');

    const userSummary = await MessLib.userSummary(start, end, student._id, messId);
    console.log('✔ Student User Summary calculated:', userSummary);
    assert(typeof userSummary.meals === 'number');

    // Clean up test records
    await Balance.deleteOne({ _id: testBalance._id });
    await Meal.deleteOne({ _id: testMeal._id });
    await Expense.deleteOne({ _id: testExpense._id });
    console.log('✔ Test financial records cleaned up');

    // 9. Data persistence across database reconnect
    console.log('\n9. Testing Data Persistence Across Database Reconnect...');
    const adminCheckBefore = await User.findOne({ email: 'admin@sagemess.local' });
    const countUsersBefore = await User.countDocuments();
    const countMenusBefore = await Menu.countDocuments();

    // Reopen database connection to simulate application restart
    const Database = require('better-sqlite3');
    const dbTest = new Database(databasePath);
    const userRow = dbTest.prepare('SELECT email, username, role FROM users WHERE email = ?').get('admin@sagemess.local');
    assert.strictEqual(userRow.email, adminCheckBefore.email);
    assert.strictEqual(userRow.username, adminCheckBefore.username);
    assert.strictEqual(userRow.role, adminCheckBefore.role);

    const totalUsersAfter = dbTest.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    assert.strictEqual(totalUsersAfter, countUsersBefore);

    const totalMenusAfter = dbTest.prepare('SELECT COUNT(*) AS c FROM menus').get().c;
    assert.strictEqual(totalMenusAfter, countMenusBefore);
    dbTest.close();
    console.log('✔ Data fully persisted and verified on reopened SQLite connection');

    // 10. Express API endpoint contracts
    console.log('\n10. Testing Express API Endpoints & Route Contracts...');
    const express = require('express');
    const AppModule = require('./app/modules/index');
    const MenuRoute = require('./app/modules/menu/menu.route');
    const FeedbackRoute = require('./app/modules/feedback/feedback.route');
    const StudentRoute = require('./app/modules/student/student.route');
    const AnnouncementRoute = require('./app/modules/announcement/announcement.route');

    const {
        AuthModule,
        CategoryModule,
        BalanceModule,
        ExpenseModule,
        MealModule,
        MessModule,
        UserModule
    } = AppModule;

    const { UserRoute } = UserModule;
    const { CategoryRoute } = CategoryModule;
    const { BalanceRoute } = BalanceModule;
    const { ExpenseRoute } = ExpenseModule;
    const { MealRoute } = MealModule;
    const { MessRoute } = MessModule;
    const { AuthController, AuthRoute } = AuthModule;

    const authController = new AuthController();
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/auth', AuthRoute);
    app.all('/api/v1/*', authController.isAuthenticate);
    app.use('/api/v1/user', UserRoute);
    app.use('/api/v1/category', CategoryRoute);
    app.use('/api/v1/balance', BalanceRoute);
    app.use('/api/v1/expense', ExpenseRoute);
    app.use('/api/v1/meal', MealRoute);
    app.use('/api/v1/mess', MessRoute);
    app.use('/api/v1/menu', MenuRoute);
    app.use('/api/v1/feedback', FeedbackRoute);
    app.use('/api/v1/student', StudentRoute);
    app.use('/api/v1/announcement', AnnouncementRoute);

    function mockRequest(appInstance, method, url, headers = {}, body = null) {
        return new Promise((resolve, reject) => {
            const req = {
                method,
                url,
                headers: { 'content-type': 'application/json', ...headers },
                body: body || {},
            };
            const res = {
                statusCode: 200,
                _headers: {},
                _body: '',
                status(code) { this.statusCode = code; return this; },
                setHeader(k, v) { this._headers[k] = v; },
                json(obj) { this._body = obj; resolve({ status: this.statusCode, headers: this._headers, data: obj }); },
                send(text) { this._body = text; resolve({ status: this.statusCode, headers: this._headers, data: text }); }
            };
            appInstance.handle(req, res, (err) => {
                if (err) reject(err);
                else resolve({ status: res.statusCode, headers: res._headers, data: res._body });
            });
        });
    }

    // Admin Login API
    const adminLoginRes = await mockRequest(app, 'POST', '/api/auth/login', {}, { email: 'admin@sagemess.local', password: 'sage123' });
    assert.strictEqual(adminLoginRes.status, 200);
    assert(adminLoginRes.data.success);
    const apiAdminToken = adminLoginRes.data.data.token;
    assert(apiAdminToken);
    console.log('✔ POST /api/auth/login returned valid token for Admin');

    // Student Login API
    const studentLoginRes = await mockRequest(app, 'POST', '/api/auth/login', {}, { email: 'student@sagemess.local', password: 'sage123' });
    assert.strictEqual(studentLoginRes.status, 200);
    assert(studentLoginRes.data.success);
    const apiStudentToken = studentLoginRes.data.data.token;
    assert(apiStudentToken);
    console.log('✔ POST /api/auth/login returned valid token for Student');

    // Authenticated API routes
    const usersApiRes = await mockRequest(app, 'GET', '/api/v1/user/getUsers', { 'x-auth-token': apiAdminToken });
    assert.strictEqual(usersApiRes.status, 200);
    assert(usersApiRes.data.success);
    console.log('✔ GET /api/v1/user/getUsers succeeded with token');

    const weeklyApiRes = await mockRequest(app, 'GET', '/api/v1/menu/weekly', { 'x-auth-token': apiStudentToken });
    assert.strictEqual(weeklyApiRes.status, 200);
    assert(weeklyApiRes.data.success);
    console.log('✔ GET /api/v1/menu/weekly succeeded with token');

    const dashApiRes = await mockRequest(app, 'GET', '/api/v1/student/dashboard', { 'x-auth-token': apiStudentToken });
    assert.strictEqual(dashApiRes.status, 200);
    assert(dashApiRes.data.success);
    console.log('✔ GET /api/v1/student/dashboard succeeded with token');

    console.log('\n======================================================');
    console.log('✔✔✔ ALL SQLITE MIGRATION VERIFICATION TESTS PASSED ✔✔✔');
    console.log('======================================================');
}

runTests().catch(err => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
});
