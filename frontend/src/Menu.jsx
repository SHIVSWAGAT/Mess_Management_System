
import { useEffect, useState } from 'react'
import {
  getWeeklyMenu,
  addMenu,
  updateMenu,
  deleteMenu,
} from './services/api'
import './Menu.css'

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
]

const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner']

const emptyForm = {
  day: 'Monday',
  breakfast: '',
  lunch: '',
  snacks: '',
  dinner: '',
  specialNote: '',
  isSpecialDay: false,
}

function dishesToText(dishes) {
  return Array.isArray(dishes) ? dishes.join(', ') : ''
}

function textToDishes(text) {
  return text.split(',').map((item) => item.trim()).filter(Boolean)
}

export default function Menu() {
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [showForm, setShowForm] = useState(false)
  const [editingMenu, setEditingMenu] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [menuToDelete, setMenuToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function loadMenus() {
    setLoading(true)
    setError('')
    try {
      const data = await getWeeklyMenu()
      setMenus(data)
    } catch (err) {
      setError(err.message || 'Unable to load weekly menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMenus()
  }, [])

  const selectedMenu = menus.find((menu) => menu.day === selectedDay)

  function openAddForm(day = selectedDay) {
    setEditingMenu(null)
    setForm({ ...emptyForm, day })
    setFormError('')
    setSuccess('')
    setShowForm(true)
  }

  function openEditForm(menu) {
    setEditingMenu(menu)
    setForm({
      day: menu.day,
      breakfast: dishesToText(menu.breakfast),
      lunch: dishesToText(menu.lunch),
      snacks: dishesToText(menu.snacks),
      dinner: dishesToText(menu.dinner),
      specialNote: menu.specialNote || '',
      isSpecialDay: Boolean(menu.isSpecialDay),
    })
    setFormError('')
    setSuccess('')
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return
    setShowForm(false)
    setEditingMenu(null)
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    setSuccess('')

    const payload = {
      day: form.day,
      breakfast: textToDishes(form.breakfast),
      lunch: textToDishes(form.lunch),
      snacks: textToDishes(form.snacks),
      dinner: textToDishes(form.dinner),
      specialNote: form.specialNote.trim(),
      isSpecialDay: form.isSpecialDay,
    }

    try {
      if (editingMenu) {
        await updateMenu(editingMenu._id, payload)
        setSuccess(`${form.day} menu updated successfully!`)
      } else {
        await addMenu(payload)
        setSuccess(`${form.day} menu added successfully!`)
      }
      setSelectedDay(form.day)
      setShowForm(false)
      setEditingMenu(null)
      await loadMenus()
    } catch (err) {
      setFormError(err.message || 'Unable to save menu')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!menuToDelete || deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteMenu(menuToDelete._id)
      setSuccess(`${menuToDelete.day} menu deleted successfully!`)
      setMenuToDelete(null)
      await loadMenus()
    } catch (err) {
      setDeleteError(err.message || 'Unable to delete menu')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="menu-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FOOD & DINING</span>
          <h1>Mess Menu <span>✳</span></h1>
          <p>Plan and manage delicious meals throughout the week.</p>
        </div>
      </div>

      <div className="menu-overview">
        <div>
          <span className="eyebrow">WEEKLY MEAL PLANNER</span>
          <h2>{loading ? '—' : `${menus.length} / 7 Days`}</h2>
          <p>Days with published menus</p>
        </div>
        <button className="menu-refresh" onClick={loadMenus} disabled={loading}>
          ↻ {loading ? 'Loading...' : 'Refresh Menu'}
        </button>
      </div>

      {success && <div className="menu-success">✓ {success}</div>}
      {error && <div className="menu-error">{error}</div>}

      <div className="menu-content">
        <div className="menu-week-selector">
          <div className="menu-week-heading">
            <span className="eyebrow">SELECT A DAY</span>
            <h3>This Week</h3>
          </div>
          {DAYS.map((day) => {
            const exists = menus.some((menu) => menu.day === day)
            return (
              <button
                key={day}
                type="button"
                className={`menu-day-button ${selectedDay === day ? 'active' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                <span>{day}</span>
                <span className={`menu-day-indicator ${exists ? 'published' : ''}`}>
                  {exists ? '✓' : '+'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="menu-day-panel">
          <div className="menu-panel-heading">
            <div>
              <span className="eyebrow">DAILY FOOD SCHEDULE</span>
              <h2>{selectedDay}</h2>
              <p>
                {selectedMenu
                  ? 'Your published meal schedule'
                  : 'No menu has been published for this day yet.'}
              </p>
            </div>
            {selectedMenu && (
              <span className="menu-published-badge">● Published</span>
            )}
          </div>

          {loading ? (
            <div className="menu-empty-state">Loading your menu...</div>
          ) : selectedMenu ? (
            <>
              <div className="menu-meal-grid">
                {MEALS.map((meal) => (
                  <div className="menu-meal-card" key={meal}>
                    <div className="menu-meal-icon">
                      {meal === 'breakfast' ? '☀' :
                       meal === 'lunch' ? '◒' :
                       meal === 'snacks' ? '☕' : '☾'}
                    </div>
                    <span className="eyebrow">{meal.toUpperCase()}</span>
                    <h3>{meal.charAt(0).toUpperCase() + meal.slice(1)}</h3>
                    <div className="menu-dishes">
                      {selectedMenu[meal]?.length
                        ? selectedMenu[meal].map((dish, index) => (
                            <span className="menu-dish" key={index}>{dish}</span>
                          ))
                        : <span className="menu-no-dishes">No dishes added</span>}
                    </div>
                  </div>
                ))}
              </div>

              {(selectedMenu.specialNote || selectedMenu.isSpecialDay) && (
                <div className="menu-special-note">
                  <strong>
                    {selectedMenu.isSpecialDay ? '✦ Special Day' : '✦ Note'}
                  </strong>
                  <p>{selectedMenu.specialNote || 'Special menu planned for today!'}</p>
                </div>
              )}

              <div className="menu-panel-actions">
                <button
                  className="menu-edit-button"
                  onClick={() => openEditForm(selectedMenu)}
                >
                  ✎ Edit Menu
                </button>
                <button
                  className="menu-delete-button"
                  onClick={() => {
                    setMenuToDelete(selectedMenu)
                    setDeleteError('')
                  }}
                >
                  Delete Menu
                </button>
              </div>
            </>
          ) : (
            <div className="menu-empty-state">
              <div className="menu-empty-icon">✳</div>
              <h3>Nothing on the menu yet</h3>
              <p>Start planning meals for {selectedDay}.</p>
              <button className="menu-add-button" onClick={() => openAddForm(selectedDay)}>
                + Add {selectedDay} Menu
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="student-modal-overlay" onClick={closeForm}>
          <div
            className="menu-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="student-modal-header">
              <div>
                <span className="eyebrow">
                  {editingMenu ? 'UPDATE MENU' : 'CREATE MENU'}
                </span>
                <h2 id="menu-modal-title">
                  {editingMenu ? 'Edit Daily Menu' : 'Add Daily Menu'}
                </h2>
                <p>Separate multiple dishes using commas.</p>
              </div>
              <button className="student-modal-close" onClick={closeForm} disabled={saving}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="menu-form-grid">
                <label>
                  Day of the Week
                  <select
                    name="day"
                    value={form.day}
                    onChange={updateField}
                    disabled={Boolean(editingMenu)}
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </label>

                {MEALS.map((meal) => (
                  <label key={meal}>
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                    <textarea
                      name={meal}
                      value={form[meal]}
                      onChange={updateField}
                      placeholder={`e.g. ${meal === 'breakfast' ? 'Idli, Sambar, Tea' : 'Rice, Dal, Curry'}`}
                      rows="2"
                    />
                  </label>
                ))}

                <label>
                  Special Note
                  <textarea
                    name="specialNote"
                    value={form.specialNote}
                    onChange={updateField}
                    placeholder="e.g. Special dinner for festival"
                    rows="2"
                  />
                </label>

                <label className="menu-checkbox-label">
                  <input
                    type="checkbox"
                    name="isSpecialDay"
                    checked={form.isSpecialDay}
                    onChange={updateField}
                  />
                  Mark as Special Day
                </label>
              </div>

              {formError && <div className="student-form-error">{formError}</div>}

              <div className="student-modal-actions">
                <button type="button" className="student-cancel-button" onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="student-submit-button" disabled={saving}>
                  {saving ? 'Saving...' : editingMenu ? 'Save Changes' : '+ Publish Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {menuToDelete && (
        <div className="student-modal-overlay" onClick={() => !deleting && setMenuToDelete(null)}>
          <div className="student-delete-modal" role="alertdialog" aria-modal="true"
            onClick={(event) => event.stopPropagation()}>
            <div className="student-delete-icon">!</div>
            <h2>Delete {menuToDelete.day} Menu?</h2>
            <p>This day's published menu will be permanently removed.</p>
            {deleteError && <div className="student-form-error">{deleteError}</div>}
            <div className="student-delete-actions">
              <button className="student-cancel-button" onClick={() => setMenuToDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="student-confirm-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
