
import { useEffect, useMemo, useState } from 'react';
import {
  getStudents,
  getExpenseCategories,
  getPayments,
  addPayment,
  updatePayment,
  deletePayment,
  getAvailableBalance,
} from './services/api';
import './Payments.css';

const emptyForm = () => ({
  userId: '',
  categoryId: '',
  amount: '',
  date: new Date().toLocaleDateString('en-CA'),
});

const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm());

  async function loadData() {
    try {
      setError('');

      const [paymentData, studentData, categoryData, balance] =
        await Promise.all([
          getPayments(),
          getStudents(),
          getExpenseCategories(),
          getAvailableBalance(),
        ]);

      setPayments(paymentData);
      setStudents(studentData);
      setCategories(categoryData);
      setAvailableBalance(balance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const monthlyCollection = useMemo(
    () => payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    ),
    [payments]
  );

  const uniqueStudents = useMemo(
    () => new Set(payments.map((p) => String(p.userId))).size,
    [payments]
  );

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const student = students.find(
        (s) => String(s._id) === String(payment.userId)
      );

      const category = categories.find(
        (c) => String(c._id) === String(payment.categoryId)
      );

      return [
        payment.username,
        student?.username,
        student?.email,
        payment.category,
        category?.name,
        payment.amount,
      ].some((value) =>
        String(value ?? '').toLowerCase().includes(query)
      );
    });
  }, [payments, students, categories, search]);

  function openAdd() {
    setSelected(null);
    setForm(emptyForm());
    setError('');
    setModal('add');
  }

  function openEdit(payment) {
    setSelected(payment);
    setForm({
      userId: String(payment.userId || ''),
      categoryId: String(payment.categoryId || ''),
      amount: String(payment.amount ?? ''),
      date: payment.date
        ? new Date(payment.date).toISOString().slice(0, 10)
        : new Date().toLocaleDateString('en-CA'),
    });
    setError('');
    setModal('edit');
  }

  function openDelete(payment) {
    setSelected(payment);
    setError('');
    setModal('delete');
  }

  function closeModal() {
    if (saving) return;
    setModal('');
    setSelected(null);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.userId || !form.categoryId || !form.date) {
      setError('Please fill all required fields.');
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setNotice('');

      const payload = {
        userId: form.userId,
        categoryId: form.categoryId,
        amount,
        date: form.date,
      };

      if (modal === 'edit') {
        await updatePayment(selected._id, payload);
        setNotice('Payment updated successfully.');
      } else {
        await addPayment(payload);
        setNotice('Payment added successfully.');
      }

      setModal('');
      setSelected(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;

    try {
      setSaving(true);
      setError('');
      setNotice('');

      await deletePayment(selected._id);

      setModal('');
      setSelected(null);
      setNotice('Payment deleted successfully.');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function studentName(payment) {
    const student = students.find(
      (s) => String(s._id) === String(payment.userId)
    );

    return payment.username || student?.username || 'Unknown Student';
  }

  function categoryName(payment) {
    const category = categories.find(
      (c) => String(c._id) === String(payment.categoryId)
    );

    return payment.category || category?.name || 'Unknown Category';
  }

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div>
          <h1>Payments & Billing</h1>
          <p>Manage student payments and mess collections.</p>
        </div>

        <button
          className="payments-primary-btn"
          onClick={openAdd}
        >
          + Add Payment
        </button>
      </div>

      {notice && (
        <div className="payments-notice">{notice}</div>
      )}

      {error && !modal && (
        <div className="payments-error">{error}</div>
      )}

      <div className="payments-stats">
        <div className="payments-stat-card">
          <span>Monthly Collections</span>
          <h2>{money(monthlyCollection)}</h2>
          <small>Current month</small>
        </div>

        <div className="payments-stat-card">
          <span>Available Mess Balance</span>
          <h2>{money(availableBalance)}</h2>
          <small>Collections minus expenses</small>
        </div>

        <div className="payments-stat-card">
          <span>Payment Records</span>
          <h2>{payments.length}</h2>
          <small>Current month</small>
        </div>

        <div className="payments-stat-card">
          <span>Students Paid</span>
          <h2>{uniqueStudents}</h2>
          <small>Unique students with records</small>
        </div>
      </div>

      <div className="payments-panel">
        <div className="payments-toolbar">
          <div>
            <h2>Payment History</h2>
            <p>All payment records for the current month</p>
          </div>

          <input
            type="search"
            placeholder="Search student, category or amount..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="payments-empty">Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="payments-empty">
            {search
              ? 'No matching payment records.'
              : 'No payment records found for this month.'}
          </div>
        ) : (
          <div className="payments-table-wrap">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <strong>{studentName(payment)}</strong>
                    </td>
                    <td>{categoryName(payment)}</td>
                    <td>
                      {new Date(payment.date).toLocaleDateString(
                        'en-IN'
                      )}
                    </td>
                    <td className="payments-amount">
                      {money(payment.amount)}
                    </td>
                    <td>
                      <div className="payments-actions">
                        <button
                          onClick={() => openEdit(payment)}
                        >
                          Edit
                        </button>
                        <button
                          className="payments-delete-btn"
                          onClick={() => openDelete(payment)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="payments-modal-overlay">
          <div className="payments-modal">
            <div className="payments-modal-header">
              <h2>
                {modal === 'edit' ? 'Edit Payment' : 'Add Payment'}
              </h2>
              <button onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Student</label>
              <select
                required
                value={form.userId}
                onChange={(event) =>
                  setForm({ ...form, userId: event.target.value })
                }
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.username} ({student.email})
                  </option>
                ))}
              </select>

              <label>Payment Category</label>
              <select
                required
                value={form.categoryId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    categoryId: event.target.value,
                  })
                }
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <label>Amount (₹)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Enter amount"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
              />

              <label>Payment Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(event) =>
                  setForm({ ...form, date: event.target.value })
                }
              />

              {error && (
                <div className="payments-error">{error}</div>
              )}

              <div className="payments-modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="payments-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : modal === 'edit'
                    ? 'Save Changes'
                    : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="payments-modal-overlay">
          <div className="payments-modal">
            <div className="payments-modal-header">
              <h2>Delete Payment</h2>
              <button onClick={closeModal}>×</button>
            </div>

            <p>
              Are you sure you want to delete this payment of{' '}
              <strong>{money(selected?.amount)}</strong>?
            </p>

            {error && (
              <div className="payments-error">{error}</div>
            )}

            <div className="payments-modal-actions">
              <button onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button
                className="payments-danger-btn"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
