/**
 * DineDesk Database Seeder
 * Idempotent seeder that populates realistic demonstration data
 * with strict branch requirements and roll number specifications.
 */

require('dotenv').config();
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const { db, databasePath } = require('./app/database/sqlite');

const PASSWORD = 'sage123'; // Compatible with existing demo credentials

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharva', 'Advik', 'Pranav', 'Advaith', 'Aaryan', 'Dhruv', 'Kabir', 'Rohan', 'Karan',
  'Ananya', 'Diya', 'Aadhya', 'Pari', 'Saanvi', 'Myra', 'Anika', 'Navya', 'Avani', 'Isha',
  'Sneha', 'Tanvi', 'Pooja', 'Riya', 'Kavya', 'Meera', 'Roshni', 'Simran', 'Shreya', 'Neha',
  'Abhishek', 'Akash', 'Ayush', 'Chirag', 'Deepak', 'Gaurav', 'Harsh', 'Manish', 'Nikhil', 'Rahul',
  'Sachin', 'Siddharth', 'Varun', 'Vikas', 'Yash', 'Alok', 'Amit', 'Ankit', 'Bhavin', 'Chetan',
  'Darshan', 'Gautam', 'Hemant', 'Jatin', 'Kunal', 'Mohit', 'Naveen', 'Pankaj', 'Piyush', 'Rajesh',
  'Sandeep', 'Saurabh', 'Sumit', 'Tarun', 'Umesh', 'Anjali', 'Bhavna', 'Deepika', 'Divya', 'Garima',
  'Kajal', 'Komal', 'Manisha', 'Monika', 'Pallavi', 'Payal', 'Preeti', 'Priyanka', 'Rashmi', 'Richa'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Saxena', 'Mehta', 'Chopra', 'Joshi', 'Kashyap',
  'Patel', 'Shah', 'Deshmukh', 'Kulkarni', 'Patil', 'Pawar', 'Shinde', 'Jadhav', 'More', 'Chavan',
  'Nair', 'Menon', 'Pillai', 'Kurian', 'Varghese', 'Rao', 'Reddy', 'Murthy', 'Iyengar', 'Iyer',
  'Das', 'Sen', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Bose', 'Dutta', 'Ghosh', 'Roy', 'Mitra',
  'Mishra', 'Pandey', 'Tiwari', 'Shukla', 'Dubey', 'Tripathi', 'Chaubey', 'Upadhyay', 'Singh', 'Thakur'
];

const HOSTELS = ['Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Girls Hostel A', 'Girls Hostel B'];

function generateName(index) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  return `${first} ${last}`;
}

async function seed() {
  console.log(`\n=== DINEDESK DATABASE SEEDING ===`);
  console.log(`Database target: ${databasePath}\n`);

  const hashedPassword = bcrypt.hashSync(PASSWORD, 10);
  const now = new Date().toISOString();

  // 1. Ensure Mess Entity
  let mess = db.prepare("SELECT * FROM messes WHERE messusername IN ('dinedesk', 'sagemess') LIMIT 1").get();
  if (!mess) {
    const messId = randomUUID();
    db.prepare("INSERT INTO messes (_id, messusername) VALUES (?, ?)").run(messId, 'dinedesk');
    mess = { _id: messId, messusername: 'dinedesk' };
    console.log(`✔ Created mess: DineDesk (_id: ${messId})`);
  } else {
    if (mess.messusername !== 'dinedesk' && !db.prepare("SELECT 1 FROM messes WHERE messusername = 'dinedesk'").get()) {
      db.prepare("UPDATE messes SET messusername = 'dinedesk' WHERE _id = ?").run(mess._id);
      mess.messusername = 'dinedesk';
      console.log(`✔ Updated mess branding to DineDesk`);
    }
    console.log(`✔ Found existing mess: ${mess.messusername} (_id: ${mess._id})`);
  }
  const messId = mess._id;

  // 2. Ensure Admin Accounts
  const existingAdmin = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
  let adminId;
  if (!existingAdmin) {
    adminId = randomUUID();
    db.prepare(`
      INSERT INTO users (_id, email, username, password, phone, messId, role)
      VALUES (?, ?, ?, ?, ?, ?, 'admin')
    `).run(adminId, 'admin@dinedesk.local', 'Priya Nair', hashedPassword, '9876543210', messId);
    console.log(`✔ Created Admin: Priya Nair (admin@dinedesk.local)`);
  } else {
    adminId = existingAdmin._id;
    console.log(`✔ Preserved Admin: ${existingAdmin.username} (${existingAdmin.email})`);
  }

  // Also ensure admin@dinedesk.local exists if the current admin is admin@sagemess.local
  const dinedeskAdmin = db.prepare("SELECT * FROM users WHERE email = 'admin@dinedesk.local'").get();
  if (!dinedeskAdmin && existingAdmin && existingAdmin.email !== 'admin@dinedesk.local') {
    db.prepare(`
      INSERT INTO users (_id, email, username, password, phone, messId, role)
      VALUES (?, ?, ?, ?, ?, ?, 'admin')
    `).run(randomUUID(), 'admin@dinedesk.local', 'DineDesk Admin', hashedPassword, '9876543211', messId);
    console.log(`✔ Added alias Admin: admin@dinedesk.local`);
  }

  // 3. Ensure Demo Student Account (Arjun Das)
  // If student@sagemess.local exists, update him to be B100001 (CSE-A) to satisfy exact roll & branch constraints
  let demoStudent = db.prepare("SELECT * FROM users WHERE email = 'student@sagemess.local'").get();
  if (demoStudent) {
    db.prepare(`
      UPDATE users SET rollNumber = 'B100001', department = 'CSE-A', hostel = 'Hostel 2', roomNumber = '214'
      WHERE _id = ?
    `).run(demoStudent._id);
    console.log(`✔ Updated demo student Arjun Das -> Roll: B100001, Branch: CSE-A`);
  } else {
    const studentDinedesk = db.prepare("SELECT * FROM users WHERE email = 'student@dinedesk.local'").get();
    if (!studentDinedesk) {
      const studentId = randomUUID();
      db.prepare(`
        INSERT INTO users (_id, email, username, password, phone, rollNumber, department, hostel, roomNumber, messId, role)
        VALUES (?, 'student@dinedesk.local', 'Arjun Das', ?, '9123456780', 'B100001', 'CSE-A', 'Hostel 2', '214', ?, 'user')
      `).run(studentId, hashedPassword, messId);
      demoStudent = { _id: studentId, email: 'student@dinedesk.local' };
      console.log(`✔ Created demo student Arjun Das -> student@dinedesk.local, Roll: B100001, Branch: CSE-A`);
    } else {
      demoStudent = studentDinedesk;
    }
  }

  // Also ensure student@sagemess.local alias exists if user logged in with old email
  const sagemessStudent = db.prepare("SELECT * FROM users WHERE email = 'student@sagemess.local'").get();
  if (!sagemessStudent && demoStudent && demoStudent.email !== 'student@sagemess.local') {
    db.prepare(`
      INSERT INTO users (_id, email, username, password, phone, rollNumber, department, hostel, roomNumber, messId, role)
      VALUES (?, 'student@sagemess.local', 'Arjun Das', ?, '9123456780', 'B100001', 'CSE-A', 'Hostel 2', '214', ?, 'user')
    `).run(randomUUID(), hashedPassword, messId);
  }

  // 4. Populate 450 Students Across 6 Permitted Branches
  // Branch specification:
  // 1. CSE-A: 75 students (B100001 to B100075)
  // 2. CSE-B: 75 students (B100076 to B100150)
  // 3. ETC:   75 students (B200001 to B200075)
  // 4. EEE:   75 students (B300001 to B300075)
  // 5. IT:    75 students (B400001 to B400075)
  // 6. CE:    75 students (B500001 to B500075)

  console.log(`\nPopulating students according to branch quotas...`);

  const BRANCH_CONFIGS = [
    { branch: 'CSE-A', code: 1, startSerial: 1, count: 75 },
    { branch: 'CSE-B', code: 1, startSerial: 76, count: 75 },
    { branch: 'ETC',   code: 2, startSerial: 1, count: 75 },
    { branch: 'EEE',   code: 3, startSerial: 1, count: 75 },
    { branch: 'IT',    code: 4, startSerial: 1, count: 75 },
    { branch: 'CE',    code: 5, startSerial: 1, count: 75 },
  ];

  const insertStudentStmt = db.prepare(`
    INSERT INTO users (_id, email, username, password, phone, rollNumber, department, hostel, roomNumber, messId, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user')
  `);

  let globalStudentIdx = 0;
  let insertedCount = 0;

  for (const cfg of BRANCH_CONFIGS) {
    let branchInserted = 0;
    for (let i = 0; i < cfg.count; i++) {
      const serialNum = cfg.startSerial + i;
      const serialFormatted = String(serialNum).padStart(5, '0');
      const rollNumber = `B${cfg.code}${serialFormatted}`;

      // Check if student with this rollNumber already exists
      const existing = db.prepare("SELECT * FROM users WHERE rollNumber = ?").get(rollNumber);
      if (existing) {
        // Ensure department is exact
        if (existing.department !== cfg.branch) {
          db.prepare("UPDATE users SET department = ? WHERE _id = ?").run(cfg.branch, existing._id);
        }
        continue;
      }

      globalStudentIdx++;
      const name = generateName(globalStudentIdx + (cfg.code * 100));
      const email = `student.${rollNumber.toLowerCase()}@dinedesk.local`;
      const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
      const hostel = HOSTELS[globalStudentIdx % HOSTELS.length];
      const roomNumber = `${Math.floor(1 + (globalStudentIdx % 4))}${String(1 + (globalStudentIdx % 30)).padStart(2, '0')}`;

      insertStudentStmt.run(
        randomUUID(),
        email,
        name,
        hashedPassword,
        phone,
        rollNumber,
        cfg.branch,
        hostel,
        roomNumber,
        messId
      );
      branchInserted++;
      insertedCount++;
    }

    const currentBranchCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE department = ? AND role = 'user'").get(cfg.branch).c;
    console.log(`  • ${cfg.branch}: ${currentBranchCount} students (Added: ${branchInserted})`);
  }

  const totalStudents = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'user'").get().c;
  const cseTotal = db.prepare("SELECT COUNT(*) AS c FROM users WHERE department IN ('CSE-A', 'CSE-B') AND role = 'user'").get().c;
  console.log(`✔ Total Students: ${totalStudents} (CSE total: ${cseTotal})\n`);

  // 5. Categories
  console.log(`Ensuring mess categories...`);
  const CATEGORIES = [
    { name: 'Daily Meal Deposit', isMeal: 1 },
    { name: 'Vegetables & Produce', isMeal: 0 },
    { name: 'Dairy & Milk Products', isMeal: 0 },
    { name: 'Grains, Pulses & Oil', isMeal: 0 },
    { name: 'Gas & Kitchen Fuel', isMeal: 0 },
    { name: 'Snacks & Beverages', isMeal: 0 },
  ];

  const catMap = {};
  for (const cat of CATEGORIES) {
    let row = db.prepare("SELECT * FROM categories WHERE name = ? AND messId = ?").get(cat.name, messId);
    if (!row) {
      const catId = randomUUID();
      db.prepare("INSERT INTO categories (_id, name, messId, isMeal) VALUES (?, ?, ?, ?)").run(catId, cat.name, messId, cat.isMeal);
      row = { _id: catId, name: cat.name };
      console.log(`  • Created category: ${cat.name} (isMeal: ${cat.isMeal})`);
    }
    catMap[cat.name] = row._id;
  }

  // 6. Weekly Menus (All 7 Days)
  console.log(`\nConfiguring Weekly DineDesk Menu...`);
  const WEEK_MENUS = [
    {
      day: 'Monday',
      breakfast: ['Poha with Peanuts', 'Boiled Eggs', 'Banana', 'Masala Chai / Coffee'],
      lunch: ['Steamed Rice', 'Yellow Dal Tadka', 'Aloo Gobi Matar', 'Fresh Curd', 'Green Salad'],
      snacks: ['Crispy Veg Samosa', 'Mint Chutney', 'Special Tea'],
      dinner: ['Phulka Roti (Butter)', 'Paneer Butter Masala', 'Jeera Rice', 'Moong Dal Halwa'],
      specialNote: 'Fresh sweet curd served with lunch.',
      isSpecialDay: 0,
    },
    {
      day: 'Tuesday',
      breakfast: ['Steamed Idli', 'Medu Vada', 'Sambar', 'Coconut Chutney', 'Filter Coffee'],
      lunch: ['Jeera Rice', 'Dal Fry', 'Bhindi Masala Fry', 'Boondi Raita', 'Crispy Papad'],
      snacks: ['Pani Puri / Sev Puri', 'Sweet Tamarind Chutney', 'Tea'],
      dinner: ['Tandoori Roti', 'Mix Vegetable Curry', 'Dal Tadka', 'Gulab Jamun'],
      specialNote: 'South Indian authentic breakfast morning.',
      isSpecialDay: 0,
    },
    {
      day: 'Wednesday',
      breakfast: ['Stuffed Aloo Paratha', 'Fresh Curd', 'Mango Pickle', 'Hot Chai'],
      lunch: ['Lemon Rice', 'Drumstick Sambar', 'Aloo Beans Poriyal', 'Curd Rice', 'Papad'],
      snacks: ['Veg Cutlet with Herbs', 'Tomato Dip', 'Hot Coffee'],
      dinner: ['Butter Chapati', 'Egg Curry / Paneer Do Pyaza', 'Steamed Rice', 'Dal Makhani'],
      specialNote: 'Dinner options: Choice of Egg Curry or Paneer Do Pyaza.',
      isSpecialDay: 0,
    },
    {
      day: 'Thursday',
      breakfast: ['Vegetable Masala Upma', 'Coconut Chutney', 'Sprouted Moong Salad', 'Tea'],
      lunch: ['Steamed Rice', 'Punjabi Rajma Masala', 'Dum Aloo', 'Mixed Veg Raita', 'Papad'],
      snacks: ['Mumbai Pav Bhaji', 'Butter Toasted Pav', 'Fresh Lemon & Onions', 'Tea'],
      dinner: ['Methi Thepla / Roti', 'Dal Palak', 'Kadhai Paneer', 'Jeera Pulao'],
      specialNote: 'North Indian Rajma Chawal special lunch.',
      isSpecialDay: 0,
    },
    {
      day: 'Friday',
      breakfast: ['Chole Kulche', 'Pickled Chillies', 'Sweet Lassi'],
      lunch: ['Hyderabadi Veg Biryani', 'Mirchi Ka Salan', 'Cucumber Raita', 'Roasted Papad'],
      snacks: ['Corn Bhel', 'Crispy Sev', 'Masala Tea'],
      dinner: ['Tawa Paratha', 'Amritsari Chole', 'Steamed Rice', 'Dal Tadka', 'Fruit Custard'],
      specialNote: 'Friday Biryani Lunch Feast with refreshing raita.',
      isSpecialDay: 0,
    },
    {
      day: 'Saturday',
      breakfast: ['Crispy Masala Dosa', 'Sambar', 'Tomato & Coconut Chutney', 'Filter Coffee'],
      lunch: ['Gujarati Khichdi', 'Sweet & Sour Kadhi', 'Baingan Bharta', 'Papad & Ghee'],
      snacks: ['Stuffed Bread Pakora', 'Coriander Chutney', 'Adrak Chai'],
      dinner: ['Hot Poori', 'Aloo Chana Curry', 'Rice Kheer / Payasam', 'Spicy Pickle'],
      specialNote: 'Traditional weekend comfort food prepared in pure ghee.',
      isSpecialDay: 0,
    },
    {
      day: 'Sunday',
      breakfast: ['Chole Bhature', 'Spicy Raw Mango Pickle', 'Rose Lassi'],
      lunch: ['Peas Pulao', 'Dal Maharani', 'Paneer Tikka Butter Masala', 'Pineapple Raita', 'Papad'],
      snacks: ['Moong Dal Kachori', 'Imli Saunth Chutney', 'Cardamom Tea'],
      dinner: ['Butter Naan', 'Shahi Paneer / Chicken Masala', 'Jeera Pulao', 'Vanilla Ice Cream', 'Hot Gulab Jamun'],
      specialNote: 'Sunday Grand Banquet Dinner! Choice of vegetarian or non-vegetarian entree with dessert.',
      isSpecialDay: 1,
    },
  ];

  for (const m of WEEK_MENUS) {
    const existingMenu = db.prepare("SELECT * FROM menus WHERE messId = ? AND day = ?").get(messId, m.day);
    if (!existingMenu) {
      db.prepare(`
        INSERT INTO menus (_id, messId, day, breakfast, lunch, snacks, dinner, specialNote, isSpecialDay, updatedBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(),
        messId,
        m.day,
        JSON.stringify(m.breakfast),
        JSON.stringify(m.lunch),
        JSON.stringify(m.snacks),
        JSON.stringify(m.dinner),
        m.specialNote,
        m.isSpecialDay,
        adminId,
        now,
        now
      );
      console.log(`  • Created menu for ${m.day}`);
    } else {
      db.prepare(`
        UPDATE menus SET breakfast = ?, lunch = ?, snacks = ?, dinner = ?, specialNote = ?, isSpecialDay = ?, updatedAt = ?
        WHERE _id = ?
      `).run(
        JSON.stringify(m.breakfast),
        JSON.stringify(m.lunch),
        JSON.stringify(m.snacks),
        JSON.stringify(m.dinner),
        m.specialNote,
        m.isSpecialDay,
        now,
        existingMenu._id
      );
    }
  }
  console.log(`✔ All 7 weekly menus verified and up-to-date.`);

  // 7. Announcements / Notices
  console.log(`\nConfiguring DineDesk Announcements...`);
  const NOTICES = [
    {
      title: 'DineDesk Mess Timings & Hall Guidelines',
      message: 'Breakfast: 7:30 AM – 9:30 AM | Lunch: 12:30 PM – 2:30 PM | Evening Snacks: 5:00 PM – 6:15 PM | Dinner: 8:00 PM – 9:45 PM. Students are requested to carry their digital roll cards.',
    },
    {
      title: 'Sunday Grand Feast Dinner',
      message: 'Special banquet dinner this Sunday featuring Butter Naan, Shahi Paneer, Veg Pulao, and Ice Cream. Advance meal confirmation closes Saturday 6 PM.',
    },
    {
      title: 'RO Water Purification System Serviced',
      message: 'Routine maintenance and filter replacement for the central dining hall RO purification units has been completed and certified by hygiene inspection.',
    },
    {
      title: 'Dietary Survey Updates Implemented',
      message: 'Based on student votes, South Indian breakfast roster is now active on Tuesdays and Saturdays. Fresh curd is available on all weekdays during lunch.',
    },
    {
      title: 'Zero Food Waste Campus Initiative',
      message: 'Support DineDesk in minimizing food wastage. Please serve portions mindfully at the buffet counters and join our clean plate drive.',
    },
  ];

  for (const n of NOTICES) {
    const existingNotice = db.prepare("SELECT * FROM announcements WHERE messId = ? AND title = ?").get(messId, n.title);
    if (!existingNotice) {
      db.prepare(`
        INSERT INTO announcements (_id, messId, title, message, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), messId, n.title, n.message, adminId, now, now);
      console.log(`  • Added notice: ${n.title}`);
    }
  }
  console.log(`✔ DineDesk announcements published.`);

  // 8. Student Feedback & Complaints
  console.log(`\nConfiguring Student Feedback & Complaints...`);
  const feedbackCount = db.prepare("SELECT COUNT(*) AS c FROM feedback WHERE messId = ?").get(messId).c;
  if (feedbackCount < 8) {
    const sampleStudents = db.prepare("SELECT _id FROM users WHERE role = 'user' LIMIT 15").all();
    const FEEDBACK_SAMPLES = [
      {
        type: 'Feedback',
        category: 'Food Quality',
        subject: 'Hot rotis served continuously during dinner',
        description: 'Appreciate the live roti counter in the dining hall. Chapatis are served hot and soft even during late dinner hours.',
        rating: 5,
        status: 'Resolved',
        adminResponse: 'Thank you for the kind appreciation! Kitchen staff has been informed to maintain the continuous live roti service.',
      },
      {
        type: 'Complaint',
        category: 'Hygiene',
        subject: 'Water cooler drainage issue in Dining Hall B',
        description: 'Water was overflowing around the drinking water dispenser during afternoon lunch hour.',
        rating: 2,
        status: 'Resolved',
        adminResponse: 'Drainage pipe cleaned and cleared by the campus maintenance crew. Spill mats placed under all dispensers.',
      },
      {
        type: 'Feedback',
        category: 'Taste',
        subject: 'Sunday Chole Bhature was exceptional',
        description: 'The breakfast preparation on Sunday was restaurant quality. Bhature were fluffy and not overly oily.',
        rating: 5,
        status: 'Resolved',
        adminResponse: 'Thank you! The head chef and breakfast team have been given special recognition.',
      },
      {
        type: 'Complaint',
        category: 'Service',
        subject: 'Queue management during 1:15 PM peak rush',
        description: 'Waiting time for the rice and dal counter was around 12 minutes on Thursday.',
        rating: 3,
        status: 'In Progress',
        adminResponse: 'Opening an additional parallel serving lane from 1:00 PM to 1:45 PM starting this Monday.',
      },
      {
        type: 'Feedback',
        category: 'Quantity',
        subject: 'Request for extra curd cup option',
        description: 'Would be helpful to get a second small cup of curd during summer lunches.',
        rating: 4,
        status: 'Resolved',
        adminResponse: 'Curd counter is now open for second servings upon request for all students.',
      },
      {
        type: 'Complaint',
        category: 'Taste',
        subject: 'Yellow dal was slightly salty on Wednesday',
        description: 'The dal served during Wednesday lunch was saltier than usual.',
        rating: 2,
        status: 'Resolved',
        adminResponse: 'Brought to the duty cook attention. Standardized seasoning measures re-implemented across all shifts.',
      },
      {
        type: 'Feedback',
        category: 'Other',
        subject: 'Add fresh seasonal fruit during breakfast',
        description: 'Having watermelon or papaya slices alongside bananas in the morning would be a great addition.',
        rating: 4,
        status: 'In Progress',
        adminResponse: 'Fruit vendor contract is being revised to include seasonal sliced fruits twice a week.',
      },
      {
        type: 'Feedback',
        category: 'Food Quality',
        subject: 'Cleanliness in dining hall during evening snacks',
        description: 'Tables were wiped down promptly after snacks time. Very clean ambiance.',
        rating: 5,
        status: 'Resolved',
        adminResponse: 'Thank you! Housekeeping team is on dedicated rotas between 4:30 PM and 6:30 PM.',
      },
    ];

    for (let i = 0; i < FEEDBACK_SAMPLES.length; i++) {
      const fb = FEEDBACK_SAMPLES[i];
      const studentId = sampleStudents[i % sampleStudents.length]._id;
      db.prepare(`
        INSERT INTO feedback (_id, userId, messId, type, category, subject, description, rating, status, adminResponse, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(),
        studentId,
        messId,
        fb.type,
        fb.category,
        fb.subject,
        fb.description,
        fb.rating,
        fb.status,
        fb.adminResponse,
        now,
        now
      );
    }
    console.log(`✔ Populated 8 realistic feedback and complaint records.`);
  } else {
    console.log(`✔ Existing feedback records found (${feedbackCount} items).`);
  }

  // 9. Student Payments & Balances
  console.log(`\nConfiguring Student Balances & Payments...`);
  const mealCatId = catMap['Daily Meal Deposit'];
  const balanceCount = db.prepare("SELECT COUNT(*) AS c FROM balances WHERE messId = ?").get(messId).c;
  if (balanceCount < 20) {
    const studentsForDeposit = db.prepare("SELECT _id FROM users WHERE role = 'user' LIMIT 60").all();
    const insertBalanceStmt = db.prepare(`
      INSERT INTO balances (_id, userId, categoryId, messId, amount, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < studentsForDeposit.length; i++) {
      const s = studentsForDeposit[i];
      const depositAmount = [2500, 2800, 3000, 3200, 3500][i % 5];
      const depositDate = new Date(Date.now() - (i % 25) * 86400000).toISOString();
      insertBalanceStmt.run(randomUUID(), s._id, mealCatId, messId, depositAmount, depositDate);
    }
    console.log(`✔ Populated student meal payments for 60 students.`);
  } else {
    console.log(`✔ Existing balance records found (${balanceCount} items).`);
  }

  // 10. Student Daily Meals (Attendance)
  console.log(`\nConfiguring Daily Meals Records...`);
  const mealCount = db.prepare("SELECT COUNT(*) AS c FROM meals WHERE messId = ?").get(messId).c;
  if (mealCount < 50) {
    const studentsForMeals = db.prepare("SELECT _id FROM users WHERE role = 'user' LIMIT 80").all();
    const insertMealStmt = db.prepare(`
      INSERT INTO meals (_id, userId, messId, numberOfMeal, date)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Record meals over the last 15 days
    for (let dayOffset = 0; dayOffset < 15; dayOffset++) {
      const mealDate = new Date(Date.now() - dayOffset * 86400000).toISOString();
      for (let sIdx = 0; sIdx < 40; sIdx++) {
        const student = studentsForMeals[(dayOffset * 3 + sIdx) % studentsForMeals.length];
        const mealsTaken = [2, 3, 2, 2, 3, 1, 2][(dayOffset + sIdx) % 7];
        insertMealStmt.run(randomUUID(), student._id, messId, mealsTaken, mealDate);
      }
    }
    console.log(`✔ Populated meal records across 15 days.`);
  } else {
    console.log(`✔ Existing meal records found (${mealCount} items).`);
  }

  // 11. Operational Mess Expenses
  console.log(`\nConfiguring Monthly Mess Expenses...`);
  const expenseCount = db.prepare("SELECT COUNT(*) AS c FROM expenses WHERE messId = ?").get(messId).c;
  if (expenseCount < 5) {
    const EXPENSES_LIST = [
      { category: 'Vegetables & Produce', amount: 18450, summary: 'Weekly wholesale supply of seasonal vegetables, onions and potatoes' },
      { category: 'Dairy & Milk Products', amount: 24300, summary: 'Bulk pasteurized milk, cooking paneer and fresh curd supply' },
      { category: 'Grains, Pulses & Oil', amount: 32600, summary: 'Basmati rice, whole wheat flour, toor dal, and refined cooking oil' },
      { category: 'Gas & Kitchen Fuel', amount: 8400, summary: 'Commercial 19kg LPG cylinder delivery and safety regulator check' },
      { category: 'Snacks & Beverages', amount: 6750, summary: 'Bakery pav, sandwich bread, tea leaves and South Indian coffee powder' },
      { category: 'Vegetables & Produce', amount: 9800, summary: 'Mid-week fresh tomato, coriander, lemon and ginger replenishment' },
      { category: 'Grains, Pulses & Oil', amount: 14200, summary: 'Gram flour (besan), semolina (sooji), moong dal and whole spices' },
      { category: 'Dairy & Milk Products', amount: 12500, summary: 'Special banquet butter, ghee and table curd for weekend feast' },
    ];

    const insertExpenseStmt = db.prepare(`
      INSERT INTO expenses (_id, amount, date, summary, categoryId, userId, messId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < EXPENSES_LIST.length; i++) {
      const exp = EXPENSES_LIST[i];
      const catId = catMap[exp.category] || mealCatId;
      const expDate = new Date(Date.now() - (i * 3) * 86400000).toISOString();
      insertExpenseStmt.run(randomUUID(), exp.amount, expDate, exp.summary, catId, adminId, messId);
    }
    console.log(`✔ Populated 8 realistic monthly mess operational expenses.`);
  } else {
    console.log(`✔ Existing expense records found (${expenseCount} items).`);
  }

  console.log(`\n======================================================`);
  console.log(`✔✔✔ DINEDESK DATABASE SEEDING COMPLETED SUCCESSFULLY ✔✔✔`);
  console.log(`======================================================\n`);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
