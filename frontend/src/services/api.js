
const API_BASE_URL = '/api';

// A proxy/server error can legally have an empty body. Reading text first
// prevents `Response.json()` from hiding that useful failure behind a parser error.
async function readApiJson(response) {
  const body = await response.text();

  if (!body.trim()) {
    return {
      success: false,
      message: response.status
        ? `The server returned an empty response (HTTP ${response.status}).`
        : 'The server returned an empty response.',
    };
  }

  try {
    return JSON.parse(body);
  } catch {
    return {
      success: false,
      message: `The server returned an invalid response (HTTP ${response.status}).`,
    };
  }
}

// Admin login
export async function loginAdmin(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success || !result.data?.token) {
    throw new Error(result.message || 'Login failed');
  }

  sessionStorage.setItem('messmate_token', result.data.token);

  return result.data;
}

// Get all registered students
export async function getStudents() {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch(`${API_BASE_URL}/v1/user/getUsers`, {
    method: 'GET',
    headers: {
      'x-auth-token': token,
    },
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch students');
  }

  return result.data.filter((user) => user.role === 'user');
}

// Add a new student to MongoDB
export async function addStudent(studentData) {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch(`${API_BASE_URL}/v1/user/addUser`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    body: JSON.stringify(studentData),
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to add student');
  }

  return result.data;
}

// Delete a student from the authenticated admin's mess
export async function deleteStudent(studentId) {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  if (!studentId) {
    throw new Error('Student ID is required');
  }

  const response = await fetch(
    `${API_BASE_URL}/v1/user/removeUser/${encodeURIComponent(studentId)}`,
    {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to delete student');
  }

  return result.data;
}

// Logout
export function logoutAdmin() {
  sessionStorage.removeItem('messmate_token');
}


 // Update student details in MongoDB (Admin only)
export async function updateStudent(studentId, studentData) {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  if (!studentId) {
    throw new Error('Student ID is required');
  }

  const response = await fetch(
    `/api/v1/user/updateStudent/${encodeURIComponent(studentId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(studentData),
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to update student');
  }

  return result.data;
}


// Get weekly mess menu from MongoDB
export async function getWeeklyMenu() {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch('/api/v1/menu/weekly', {
    method: 'GET',
    headers: {
      'x-auth-token': token,
    },
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch weekly menu');
  }

  return result.data;
}

// Add daily menu
export async function addMenu(menuData) {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch('/api/v1/menu/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    body: JSON.stringify(menuData),
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to add menu');
  }

  return result.data;
}

// Update existing daily menu
export async function updateMenu(menuId, menuData) {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch(
    `/api/v1/menu/update/${encodeURIComponent(menuId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(menuData),
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to update menu');
  }

  return result.data;
}

// Delete daily menu
export async function deleteMenu(menuId) {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch(
    `/api/v1/menu/delete/${encodeURIComponent(menuId)}`,
    {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to delete menu');
  }

  return result.data;
}

 // Get total registered students for Dashboard
export async function getStudentCount() {
  const students = await getStudents();
  return students.length;
}

// Get all meal records for the current month
export async function getMeals() {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch('/api/v1/meal/currentMeal', {
    headers: {
      'x-auth-token': token,
    },
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch meals');
  }

  return result.data || [];
}

// Add a new meal record
export async function addMeal(mealData) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch('/api/v1/meal/addMeal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    body: JSON.stringify(mealData),
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to add meal');
  }

  return result.data;
}

// Update an existing meal record
export async function updateMeal(mealId, mealData) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch(`/api/v1/meal/updateMeal/${mealId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    body: JSON.stringify(mealData),
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to update meal');
  }

  return result.data;
}

// Delete a meal record
export async function deleteMeal(mealId) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch(`/api/v1/meal/deleteMeal/${mealId}`, {
    method: 'DELETE',
    headers: {
      'x-auth-token': token,
    },
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to delete meal');
  }

  return result;
}

// Get total meals served in the current month
export async function getMonthlyMealCount() {
  const meals = await getMeals();

  return meals.reduce(
    (total, meal) => total + Number(meal.numberOfMeal || 0),
    0
  );
}


// Get monthly expenses
export async function getExpenses() {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch('/api/v1/expense/messTotalExpense', {
    headers: {
      'x-auth-token': token,
    },
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch expenses');
  }

  return {
    expenses: Array.isArray(result.data?.data)
      ? result.data.data
      : [],
    total: Number(result.data?.total || 0),
  };
}

// Get expense categories
export async function getExpenseCategories() {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch('/api/v1/category/getCategory', {
    headers: {
      'x-auth-token': token,
    },
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch categories');
  }

  return Array.isArray(result.data) ? result.data : [];
}

// Add expense
export async function addExpense(expenseData) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch('/api/v1/expense/addExpense', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    body: JSON.stringify(expenseData),
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to add expense');
  }

  return result.data;
}

// Update expense
export async function updateExpense(expenseId, expenseData) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch(
    `/api/v1/expense/updateExpense/${expenseId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(expenseData),
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to update expense');
  }

  return result.data;
}

// Delete expense
export async function deleteExpense(expenseId) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch(
    `/api/v1/expense/deleteExpense/${expenseId}`,
    {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to delete expense');
  }

  return result;
}

// Get logged-in admin ID from JWT
export function getAdminId() {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const normalized = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = JSON.parse(atob(normalized));

    return decoded.id || null;
  } catch {
    return null;
  }
}


// Add expense category
export async function addExpenseCategory(categoryData) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch('/api/v1/category/addCategory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    body: JSON.stringify(categoryData),
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to add category');
  }

  return result.data;
}

// Update expense category
export async function updateExpenseCategory(categoryId, categoryData) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch(
    `/api/v1/category/updateCategory/${categoryId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(categoryData),
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to update category');
  }

  return result.data;
}

// Delete expense category
export async function deleteExpenseCategory(categoryId) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch(
    `/api/v1/category/deleteCategory/${categoryId}`,
    {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to delete category');
  }

  return result;
}


// Get all payment records for the current month
export async function getPayments() {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch('/api/v1/balance/messTotalBalance', {
    headers: {
      'x-auth-token': token,
    },
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch payments');
  }

  return Array.isArray(result.data) ? result.data : [];
}

// Add a new payment
export async function addPayment(paymentData) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch('/api/v1/balance/addBalance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    body: JSON.stringify(paymentData),
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to add payment');
  }

  return result.data;
}

// Update an existing payment
export async function updatePayment(paymentId, paymentData) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch(
    `/api/v1/balance/updateBalance/${encodeURIComponent(paymentId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify(paymentData),
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to update payment');
  }

  return result.data;
}

// Delete a payment
export async function deletePayment(paymentId) {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch(
    `/api/v1/balance/deleteBalance/${encodeURIComponent(paymentId)}`,
    {
      method: 'DELETE',
      headers: {
        'x-auth-token': token,
      },
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to delete payment');
  }

  return result;
}

// Get current available mess balance
export async function getAvailableBalance() {
  const token = sessionStorage.getItem('messmate_token');

  const response = await fetch(
    '/api/v1/balance/currentAvailableBalance',
    {
      headers: {
        'x-auth-token': token,
      },
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch available balance');
  }

  return Number(result.data || 0);
}


const FEEDBACK_API = '/api/v1/feedback';

async function feedbackRequest(path, options = {}) {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch(`${FEEDBACK_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
      ...(options.headers || {}),
    },
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Feedback request failed');
  }

  return result.data;
}

export async function getAllFeedback() {
  const data = await feedbackRequest('/all');
  return Array.isArray(data) ? data : [];
}

export async function getFeedbackStats() {
  return feedbackRequest('/stats');
}

export async function addFeedback(feedbackData) {
  return feedbackRequest('/add', {
    method: 'POST',
    body: JSON.stringify(feedbackData),
  });
}

export async function updateFeedback(feedbackId, feedbackData) {
  return feedbackRequest(
    `/update/${encodeURIComponent(feedbackId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(feedbackData),
    }
  );
}

export async function deleteFeedback(feedbackId) {
  return feedbackRequest(
    `/delete/${encodeURIComponent(feedbackId)}`,
    { method: 'DELETE' }
  );
}


/* ==========================================
   ROLE-BASED AUTHENTICATION
========================================== */

export function getLoggedInUser() {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) return null;

  try {
    const payload = token.split('.')[1];

    if (!payload) return null;

    const normalized = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = JSON.parse(atob(normalized));

    if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
      sessionStorage.removeItem('messmate_token');
      return null;
    }

    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      messId: decoded.messId,
      messusername: decoded.messusername,
    };
  } catch {
    return null;
  }
}

export function getUserRole() {
  return getLoggedInUser()?.role || null;
}

export function logoutUser() {
  sessionStorage.removeItem('messmate_token');
}


/* ==========================================
   STUDENT PORTAL APIs
========================================== */

async function studentRequest(endpoint, options = {}) {
    const token = sessionStorage.getItem('messmate_token');

    if (!token) {
        throw new Error('Please login first');
    }

    const res = await fetch(`/api/v1/student${endpoint}`, {
        ...options,
        headers: {
            'x-auth-token': token,
            ...(options.headers || {})
        }
    });

    const result = await readApiJson(res);

    if (!res.ok || !result.success) {
        throw new Error(result.message || 'Request failed');
    }

    return result.data;
}

export function getStudentDashboard() {
    return studentRequest('/dashboard');
}

export function getMyMeals() {
    return studentRequest('/meals');
}

export function getMyPayments() {
    return studentRequest('/payments');
}

export function getMyComplaints() {
    return studentRequest('/complaints');
}

export async function getAnnouncements() {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch('/api/v1/announcement', {
    headers: { 'x-auth-token': token },
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to load notices');
  }

  return Array.isArray(result.data) ? result.data : [];
}

export async function addAnnouncement(notice) {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch('/api/v1/announcement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    body: JSON.stringify(notice),
  });

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to post notice');
  }

  return result.data;
}

export async function deleteAnnouncement(id) {
  const token = sessionStorage.getItem('messmate_token');

  if (!token) {
    throw new Error('Please login first');
  }

  const response = await fetch(
    `/api/v1/announcement/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { 'x-auth-token': token },
    }
  );

  const result = await readApiJson(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to remove notice');
  }

  return result.data;
}

export async function getMyProfile() {
    const token = sessionStorage.getItem('messmate_token');

    if (!token) {
        throw new Error('Please login first');
    }

    const res = await fetch('/api/v1/user/getProfile', {
        headers: {
            'x-auth-token': token
        }
    });

    const result = await readApiJson(res);

    if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to load profile');
    }

    return result.data;
}
