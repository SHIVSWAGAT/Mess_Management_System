
import { useEffect, useState } from 'react'
import {
  getExpenses,
  getExpenseCategories,
  addExpense,
  updateExpense,
  deleteExpense,
  getAdminId,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from './services/api'
import './Expenses.css'

function getToday() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState('')
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const [form, setForm] = useState({
    amount: '',
    date: getToday(),
    summary: '',
    categoryId: '',
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    isMeal: 0,
  })

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [expenseResult, categoryResult] = await Promise.all([
        getExpenses(),
        getExpenseCategories(),
      ])

      setExpenses(expenseResult.expenses)
      setTotal(expenseResult.total)
      setCategories(categoryResult)
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function closeModal() {
    if (saving) return
    setModal('')
    setSelectedExpense(null)
    setSelectedCategory(null)
    setNotice('')
  }

  function openAddExpense() {
    setForm({
      amount: '',
      date: getToday(),
      summary: '',
      categoryId: '',
    })
    setSelectedExpense(null)
    setNotice('')
    setModal('addExpense')
  }

  function openEditExpense(expense) {
    setSelectedExpense(expense)
    setForm({
      amount: String(expense.amount ?? ''),
      date: expense.date
        ? expense.date.slice(0, 10)
        : getToday(),
      summary: expense.summary || '',
      categoryId: expense.categoryId || '',
    })
    setNotice('')
    setModal('editExpense')
  }

  function openCategories() {
    setNotice('')
    setModal('categories')
  }

  function openAddCategory() {
    setCategoryForm({ name: '', isMeal: 0 })
    setSelectedCategory(null)
    setNotice('')
    setModal('addCategory')
  }

  function openEditCategory(category) {
    setSelectedCategory(category)
    setCategoryForm({
      name: category.name || '',
      isMeal: Number(category.isMeal || 0),
    })
    setNotice('')
    setModal('editCategory')
  }

  async function refreshAfterChange(message) {
    await loadData()
    setNotice(message)
  }

  async function handleExpenseSubmit(event) {
    event.preventDefault()
    setNotice('')

    const amount = Number(form.amount)
    const adminId = getAdminId()

    if (!adminId) {
      setNotice('Admin session not found. Please log in again.')
      return
    }

    if (
      !form.summary.trim() ||
      !form.categoryId ||
      !form.date ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setNotice('Please enter valid expense details.')
      return
    }

    const payload = {
      amount,
      date: form.date,
      summary: form.summary.trim(),
      categoryId: form.categoryId,
      userId: adminId,
    }

    const editing = modal === 'editExpense'

    setSaving(true)

    try {
      if (editing) {
        await updateExpense(selectedExpense._id, payload)
      } else {
        await addExpense(payload)
      }

      setModal('')
      await refreshAfterChange(
        editing
          ? 'Expense updated successfully.'
          : 'Expense added successfully.'
      )
    } catch (err) {
      setNotice(err.message || 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteExpense() {
    if (!selectedExpense) return

    setSaving(true)
    setNotice('')

    try {
      await deleteExpense(selectedExpense._id)
      setModal('')
      await refreshAfterChange('Expense deleted successfully.')
    } catch (err) {
      setNotice(err.message || 'Failed to delete expense')
    } finally {
      setSaving(false)
    }
  }

  async function handleCategorySubmit(event) {
    event.preventDefault()
    setNotice('')

    const name = categoryForm.name.trim()

    if (!name) {
      setNotice('Enter a category name.')
      return
    }

    const editing = modal === 'editCategory'

    const payload = {
      name,
      isMeal: Number(categoryForm.isMeal),
    }

    setSaving(true)

    try {
      if (editing) {
        await updateExpenseCategory(selectedCategory._id, payload)
      } else {
        await addExpenseCategory(payload)
      }

      const updatedCategories = await getExpenseCategories()
      setCategories(updatedCategories)
      setModal('categories')
      setNotice(
        editing
          ? 'Category updated successfully.'
          : 'Category added successfully.'
      )
    } catch (err) {
      setNotice(err.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCategory(category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\nWARNING: All expenses linked to this category will also be deleted. This cannot be undone.`
    )

    if (!confirmed) return

    setSaving(true)
    setNotice('')

    try {
      await deleteExpenseCategory(category._id)
      await loadData()
      setNotice('Category deleted successfully.')
    } catch (err) {
      setNotice(err.message || 'Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  function getCategoryName(expense) {
    if (expense.category) return expense.category

    return (
      categories.find(
        (category) => category._id === expense.categoryId
      )?.name || 'Unknown Category'
    )
  }

  const filteredExpenses = expenses.filter((expense) => {
    const keyword = search.toLowerCase()

    return (
      (expense.summary || '').toLowerCase().includes(keyword) ||
      getCategoryName(expense).toLowerCase().includes(keyword) ||
      (expense.username || '').toLowerCase().includes(keyword)
    )
  })

  const formatMoney = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0)

  return (
    <div className="expenses-page">
      <div className="expenses-heading">
        <div>
          <span className="eyebrow">MESS FINANCES</span>
          <h1>Expense Management ✳</h1>
          <p>Track and manage monthly mess expenses.</p>
        </div>

        <div className="expenses-actions">
          <button
            className="expenses-primary-btn"
            onClick={openCategories}
          >
            Manage Categories
          </button>

          <button
            className="expenses-primary-btn"
            onClick={openAddExpense}
          >
            + Add Expense
          </button>
        </div>
      </div>

      <div className="expenses-stats">
        <div className="expenses-stat">
          <span>Total Expenses This Month</span>
          <strong>{formatMoney(total)}</strong>
        </div>

        <div className="expenses-stat">
          <span>Expense Records</span>
          <strong>{expenses.length}</strong>
        </div>

        <div className="expenses-stat">
          <span>Available Categories</span>
          <strong>{categories.length}</strong>
        </div>
      </div>

      <div className="expenses-panel">
        <div className="expenses-panel-top">
          <div>
            <h2>Expense Records</h2>
            <p>Current month's spending history</p>
          </div>

          <div className="expenses-toolbar">
            <input
              type="search"
              placeholder="Search expenses..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <button onClick={loadData} disabled={loading}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {notice && !modal && (
          <div className="expenses-notice">{notice}</div>
        )}

        {error && (
          <div className="expenses-error">{error}</div>
        )}

        {loading ? (
          <div className="expenses-empty">
            Loading expenses...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="expenses-empty">
            No expense records found.
          </div>
        ) : (
          <div className="expenses-table-wrap">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>
                      <strong>{expense.summary}</strong>
                      <small>
                        Added by {expense.username || 'Admin'}
                      </small>
                    </td>

                    <td>
                      <span className="expenses-category">
                        {getCategoryName(expense)}
                      </span>
                    </td>

                    <td>
                      {new Date(expense.date).toLocaleDateString(
                        'en-IN',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </td>

                    <td className="expenses-amount">
                      {formatMoney(expense.amount)}
                    </td>

                    <td>
                      <div className="expenses-actions">
                        <button
                          onClick={() => openEditExpense(expense)}
                        >
                          Edit
                        </button>

                        <button
                          className="danger"
                          onClick={() => {
                            setSelectedExpense(expense)
                            setNotice('')
                            setModal('deleteExpense')
                          }}
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

      {modal && (
        <div
          className="expenses-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="expenses-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="expenses-modal-header">
              <h2>
                {modal === 'categories'
                  ? 'Manage Categories'
                  : modal === 'addCategory'
                    ? 'Add Category'
                    : modal === 'editCategory'
                      ? 'Edit Category'
                      : modal === 'addExpense'
                        ? 'Add Expense'
                        : modal === 'editExpense'
                          ? 'Edit Expense'
                          : 'Delete Expense'}
              </h2>

              <button
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            {modal === 'categories' && (
              <div className="expenses-modal-body">
                <button
                  className="expenses-primary-btn"
                  onClick={openAddCategory}
                >
                  + Add New Category
                </button>

                {notice && (
                  <p className="expenses-notice">{notice}</p>
                )}

                {categories.length === 0 ? (
                  <p>No categories added yet.</p>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category._id}
                      className="expenses-category-row"
                    >
                      <div>
                        <strong>{category.name}</strong>
                        <small>
                          {Number(category.isMeal) === 1
                            ? 'Meal Category'
                            : 'General Category'}
                        </small>
                      </div>

                      <div className="expenses-actions">
                        <button
                          onClick={() => openEditCategory(category)}
                        >
                          Edit
                        </button>

                        <button
                          className="danger"
                          disabled={saving}
                          onClick={() =>
                            handleDeleteCategory(category)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {(modal === 'addCategory' ||
              modal === 'editCategory') && (
              <form
                className="expenses-modal-body"
                onSubmit={handleCategorySubmit}
              >
                <label>
                  Category Name
                  <input
                    type="text"
                    placeholder="e.g. Rice, Vegetables, Milk"
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm({
                        ...categoryForm,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Category Type
                  <select
                    value={categoryForm.isMeal}
                    onChange={(event) =>
                      setCategoryForm({
                        ...categoryForm,
                        isMeal: Number(event.target.value),
                      })
                    }
                  >
                    <option value={0}>General Expense</option>
                    <option value={1}>Meal Expense</option>
                  </select>
                </label>

                {notice && (
                  <p className="expenses-error">{notice}</p>
                )}

                <div className="expenses-modal-actions">
                  <button
                    type="button"
                    onClick={openCategories}
                    disabled={saving}
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    className="expenses-primary-btn"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : modal === 'editCategory'
                        ? 'Save Changes'
                        : 'Add Category'}
                  </button>
                </div>
              </form>
            )}

            {(modal === 'addExpense' ||
              modal === 'editExpense') && (
              <form
                className="expenses-modal-body"
                onSubmit={handleExpenseSubmit}
              >
                <label>
                  Expense Summary
                  <input
                    type="text"
                    placeholder="e.g. Rice Purchase"
                    value={form.summary}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        summary: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        categoryId: event.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select category</option>

                    {categories.map((category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Amount (₹)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        amount: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        date: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                {notice && (
                  <p className="expenses-error">{notice}</p>
                )}

                <div className="expenses-modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="expenses-primary-btn"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : modal === 'editExpense'
                        ? 'Save Changes'
                        : 'Add Expense'}
                  </button>
                </div>
              </form>
            )}

            {modal === 'deleteExpense' && (
              <div className="expenses-modal-body">
                <p>
                  Delete expense
                  <strong>
                    {' '}{selectedExpense?.summary}
                  </strong>
                  ?
                </p>

                {notice && (
                  <p className="expenses-error">{notice}</p>
                )}

                <div className="expenses-modal-actions">
                  <button
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    className="expenses-danger-btn"
                    onClick={handleDeleteExpense}
                    disabled={saving}
                  >
                    {saving ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses
