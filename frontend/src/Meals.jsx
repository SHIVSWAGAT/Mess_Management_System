
import { useEffect, useState } from 'react'
import {
  getMeals,
  getStudents,
  addMeal,
  updateMeal,
  deleteMeal,
} from './services/api'
import './Meals.css'

const emptyForm = {
  userId: '',
  date: new Date().toLocaleDateString('en-CA'),
  numberOfMeal: '1',
}

function Meals() {
  const [meals, setMeals] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [mealData, studentData] = await Promise.all([
        getMeals(),
        getStudents(),
      ])

      setMeals(Array.isArray(mealData) ? mealData : [])
      setStudents(Array.isArray(studentData) ? studentData : [])
    } catch (err) {
      setError(err.message || 'Unable to load meal records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openAdd() {
    setForm({
      ...emptyForm,
      date: new Date().toLocaleDateString('en-CA'),
    })
    setSelectedMeal(null)
    setModal('add')
    setNotice('')
  }

  function openEdit(meal) {
    setSelectedMeal(meal)
    setForm({
      userId: meal.userId || '',
      date: meal.date
        ? new Date(meal.date).toLocaleDateString('en-CA')
        : '',
      numberOfMeal: String(meal.numberOfMeal ?? 1),
    })
    setModal('edit')
    setNotice('')
  }

  function openDelete(meal) {
    setSelectedMeal(meal)
    setModal('delete')
    setNotice('')
  }

  function closeModal() {
    if (saving) return
    setModal('')
    setSelectedMeal(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')

    const count = Number(form.numberOfMeal)

    if (!form.userId || !form.date) {
      setNotice('Please fill in all required fields.')
      return
    }

    if (!Number.isInteger(count) || count < 0) {
      setNotice('Meal count must be a non-negative whole number.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        userId: form.userId,
        date: form.date,
        numberOfMeal: count,
      }

      if (modal === 'edit') {
        await updateMeal(selectedMeal._id, payload)
      } else {
        await addMeal(payload)
      }

      setModal('')
      setSelectedMeal(null)
      await loadData()
      setNotice(
        modal === 'edit'
          ? 'Meal record updated successfully.'
          : 'Meal record added successfully.'
      )
    } catch (err) {
      setNotice(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedMeal) return

    setSaving(true)
    setNotice('')

    try {
      await deleteMeal(selectedMeal._id)
      setModal('')
      setSelectedMeal(null)
      await loadData()
      setNotice('Meal record deleted successfully.')
    } catch (err) {
      setNotice(err.message || 'Unable to delete meal')
    } finally {
      setSaving(false)
    }
  }

  function getStudentName(meal) {
    if (meal.username) return meal.username

    const student = students.find(
      (item) => item._id === meal.userId
    )

    return (
      student?.username ||
      student?.name ||
      'Unknown Student'
    )
  }

  const filteredMeals = meals.filter((meal) => {
    const name = getStudentName(meal).toLowerCase()
    const date = meal.date
      ? new Date(meal.date).toLocaleDateString('en-IN')
      : ''

    return (
      name.includes(search.toLowerCase()) ||
      date.includes(search.toLowerCase())
    )
  })

  const totalMeals = meals.reduce(
    (sum, meal) => sum + Number(meal.numberOfMeal || 0),
    0
  )

  const uniqueStudents = new Set(
    meals.map((meal) => String(meal.userId))
  ).size

  return (
    <div className="meals-page">
      <div className="meals-heading">
        <div>
          <span className="eyebrow">MESS OPERATIONS</span>
          <h1>Meal Management ✳</h1>
          <p>Track and manage student meal records.</p>
        </div>

        <button
          className="meals-primary-btn"
          onClick={openAdd}
        >
          + Add Meal
        </button>
      </div>

      <div className="meals-stats">
        <div className="meals-stat">
          <span>Total Meals This Month</span>
          <strong>{totalMeals}</strong>
        </div>

        <div className="meals-stat">
          <span>Meal Records</span>
          <strong>{meals.length}</strong>
        </div>

        <div className="meals-stat">
          <span>Students With Records</span>
          <strong>{uniqueStudents}</strong>
        </div>
      </div>

      <div className="meals-panel">
        <div className="meals-panel-top">
          <div>
            <h2>Meal Records</h2>
            <p>Current month's meal entries</p>
          </div>

          <div className="meals-toolbar">
            <input
              type="search"
              placeholder="Search student or date..."
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
          <div className="meals-notice">{notice}</div>
        )}

        {error && (
          <div className="meals-error">{error}</div>
        )}

        {loading ? (
          <div className="meals-empty">
            Loading meal records...
          </div>
        ) : filteredMeals.length === 0 ? (
          <div className="meals-empty">
            No meal records found.
          </div>
        ) : (
          <div className="meals-table-wrap">
            <table className="meals-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Meals</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMeals.map((meal) => (
                  <tr key={meal._id}>
                    <td>
                      <strong>{getStudentName(meal)}</strong>
                    </td>

                    <td>
                      {new Date(meal.date).toLocaleDateString(
                        'en-IN',
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </td>

                    <td>
                      <span className="meals-count">
                        {meal.numberOfMeal}
                      </span>
                    </td>

                    <td>
                      <div className="meals-actions">
                        <button
                          onClick={() => openEdit(meal)}
                        >
                          Edit
                        </button>

                        <button
                          className="danger"
                          onClick={() => openDelete(meal)}
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
          className="meals-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="meals-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="meals-modal-header">
              <h2>
                {modal === 'add'
                  ? 'Add Meal Record'
                  : modal === 'edit'
                    ? 'Edit Meal Record'
                    : 'Delete Meal Record'}
              </h2>

              <button
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            {modal === 'delete' ? (
              <div className="meals-modal-body">
                <p>
                  Are you sure you want to delete this
                  meal record?
                </p>

                {notice && (
                  <p className="meals-error">{notice}</p>
                )}

                <div className="meals-modal-actions">
                  <button
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    className="meals-danger-btn"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    {saving ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <form
                className="meals-modal-body"
                onSubmit={handleSubmit}
              >
                <label>
                  Student
                  <select
                    value={form.userId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        userId: event.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select student</option>

                    {students.map((student) => (
                      <option
                        key={student._id}
                        value={student._id}
                      >
                        {student.username ||
                          student.name ||
                          student.email}
                      </option>
                    ))}
                  </select>
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

                <label>
                  Number of Meals
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.numberOfMeal}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        numberOfMeal: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                {notice && (
                  <p className="meals-error">{notice}</p>
                )}

                <div className="meals-modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="meals-primary-btn"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : modal === 'edit'
                        ? 'Save Changes'
                        : 'Add Meal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Meals
