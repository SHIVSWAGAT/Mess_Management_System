
import { useEffect, useState } from 'react'
import {
  getStudents,
  addStudent,
  deleteStudent,
  updateStudent,
} from './services/api'
import './Students.css'

const initialForm = {
  username: '',
  email: '',
  password: '',
  phone: '',
  rollNumber: '',
  department: '',
  hostel: '',
  roomNumber: '',
}

const BRANCHES = ['CSE-A', 'CSE-B', 'ETC', 'EEE', 'IT', 'CE']

export default function Students() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [studentToDelete, setStudentToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function loadStudents() {
    setLoading(true)
    setError('')

    try {
      const data = await getStudents()
      setStudents(data)
    } catch (err) {
      setError(err.message || 'Unable to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  function updateField(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function openAddForm() {
    setEditingStudent(null)
    setForm(initialForm)
    setFormError('')
    setSuccess('')
    setShowForm(true)
  }

  function openEditForm(student) {
    setEditingStudent(student)
    setForm({
      username: student.username || '',
      email: student.email || '',
      password: '',
      phone: student.phone || '',
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      hostel: student.hostel || '',
      roomNumber: student.roomNumber || '',
    })
    setFormError('')
    setSuccess('')
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return
    setShowForm(false)
    setEditingStudent(null)
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setSuccess('')

    if (!editingStudent && form.password.length < 6) {
      setFormError('Password must contain at least 6 characters.')
      return
    }

    setSaving(true)

    try {
      const studentData = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        rollNumber: form.rollNumber.trim(),
        department: form.department.trim(),
        hostel: form.hostel.trim(),
        roomNumber: form.roomNumber.trim(),
      }

      if (editingStudent) {
        await updateStudent(editingStudent._id, studentData)
        setSuccess('Student details updated successfully!')
      } else {
        await addStudent({
          ...studentData,
          password: form.password,
        })
        setSuccess('Student registered successfully!')
      }

      setShowForm(false)
      setEditingStudent(null)
      setForm(initialForm)
      await loadStudents()
    } catch (err) {
      setFormError(err.message || 'Unable to save student')
    } finally {
      setSaving(false)
    }
  }

  function openDeleteConfirmation(student) {
    setStudentToDelete(student)
    setDeleteError('')
    setSuccess('')
  }

  function closeDeleteConfirmation() {
    if (deleting) return
    setStudentToDelete(null)
    setDeleteError('')
  }

  async function handleDelete() {
    if (!studentToDelete || deleting) return

    setDeleting(true)
    setDeleteError('')

    try {
      await deleteStudent(studentToDelete._id)
      setSuccess(`${studentToDelete.username} removed successfully.`)
      setStudentToDelete(null)
      await loadStudents()
    } catch (err) {
      setDeleteError(err.message || 'Unable to delete student')
    } finally {
      setDeleting(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const query = search.trim().toLowerCase()

    return [
      student.username,
      student.email,
      student.rollNumber,
      student.department,
      student.hostel,
      student.roomNumber,
    ].some((value) =>
      String(value || '').toLowerCase().includes(query)
    )
  })

  return (
    <div className="students-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">STUDENT DIRECTORY</span>
          <h1>
            Student Management <span>✳</span>
          </h1>
          <p>Manage your campus mess members in one place.</p>
        </div>
      </div>

      <div className="student-overview">
        <div>
          <span className="eyebrow">TOTAL REGISTERED</span>
          <h2>{loading ? '—' : students.length}</h2>
          <p>Students enrolled in your mess</p>
        </div>

        <div className="student-overview-actions">
          <button
            type="button"
            className="student-refresh"
            onClick={loadStudents}
            disabled={loading}
          >
            ↻ {loading ? 'Loading...' : 'Refresh Records'}
          </button>

          <button
            type="button"
            className="student-add-button"
            onClick={openAddForm}
          >
            + Add Student
          </button>
        </div>
      </div>

      {success && (
        <div className="student-success" role="status">
          ✓ {success}
        </div>
      )}

      <div className="student-directory">
        <div className="student-directory-header">
          <div>
            <h3>Student Directory</h3>
            <p>Live records from your MongoDB database</p>
          </div>

          <div className="student-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search students..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="student-empty">
            <h3>Loading students...</h3>
            <p>Fetching records from the database.</p>
          </div>
        ) : error ? (
          <div className="student-empty" role="alert">
            <h3>Unable to load students</h3>
            <p>{error}</p>
            <button type="button" onClick={loadStudents}>
              Try Again
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="student-empty">
            <h3>No students found</h3>
            <p>
              {search
                ? 'Try another name, email or roll number.'
                : 'No students have been registered yet.'}
            </p>
          </div>
        ) : (
          <div className="student-table-wrapper">
            <table className="student-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>ROLL NUMBER</th>
                  <th>DEPARTMENT</th>
                  <th>HOSTEL / ROOM</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div className="student-identity">
                        <div className="student-avatar">
                          {(student.username || 'S')
                            .split(' ')
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{student.username}</strong>
                          <span>{student.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>{student.rollNumber || '—'}</td>
                    <td>{student.department || '—'}</td>

                    <td>
                      {student.hostel || '—'}
                      {student.roomNumber
                        ? ` · Room ${student.roomNumber}`
                        : ''}
                    </td>

                    <td>
                      <span className="student-status">
                        <span className="student-status-dot" />
                        Registered
                      </span>
                    </td>

                    <td>
                      <div className="student-row-actions">
                        <button
                          type="button"
                          className="student-edit-button"
                          onClick={() => openEditForm(student)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="student-delete-button"
                          onClick={() => openDeleteConfirmation(student)}
                          aria-label={`Delete ${student.username}`}
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

        <div className="student-directory-footer">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>

      {/* ADD / EDIT STUDENT MODAL */}
      {showForm && (
        <div
          className="student-modal-overlay"
          onClick={closeForm}
        >
          <div
            className="student-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="student-modal-header">
              <div>
                <span className="eyebrow">
                  {editingStudent ? 'UPDATE RECORD' : 'NEW REGISTRATION'}
                </span>

                <h2 id="student-modal-title">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h2>

                <p>
                  {editingStudent
                    ? 'Update student information in your mess.'
                    : 'Register a new member of your campus mess.'}
                </p>
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close student form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="student-form-grid">
                <label>
                  Full Name *
                  <input
                    name="username"
                    value={form.username}
                    onChange={updateField}
                    placeholder="e.g. Rahul Das"
                    required
                  />
                </label>

                <label>
                  Email Address *
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="student@example.com"
                    required
                  />
                </label>

                {!editingStudent && (
                  <label>
                    Password *
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={updateField}
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                )}

                <label>
                  Phone Number *
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    placeholder="10-digit phone number"
                    required
                  />
                </label>

                <label>
                  Roll Number *
                  <input
                    name="rollNumber"
                    value={form.rollNumber}
                    onChange={updateField}
                    placeholder="e.g. B100001"
                    required
                  />
                </label>

                <label>
                  Department *
                  <select
                    name="department"
                    value={form.department}
                    onChange={updateField}
                    required
                  >
                    <option value="" disabled>Select branch</option>
                    {BRANCHES.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
                  </select>
                </label>

                <label>
                  Hostel *
                  <input
                    name="hostel"
                    value={form.hostel}
                    onChange={updateField}
                    placeholder="e.g. Boys Hostel"
                    required
                  />
                </label>

                <label>
                  Room Number *
                  <input
                    name="roomNumber"
                    value={form.roomNumber}
                    onChange={updateField}
                    placeholder="e.g. 102"
                    required
                  />
                </label>
              </div>

              {formError && (
                <div className="student-form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="student-modal-actions">
                <button
                  type="button"
                  className="student-cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="student-submit-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingStudent
                      ? 'Save Changes'
                      : '+ Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {studentToDelete && (
        <div
          className="student-modal-overlay"
          onClick={closeDeleteConfirmation}
        >
          <div
            className="student-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-student-title"
            aria-describedby="delete-student-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="student-delete-icon">!</div>

            <h2 id="delete-student-title">Delete Student?</h2>

            <p id="delete-student-description">
              Are you sure you want to remove{' '}
              <strong>{studentToDelete.username}</strong>?
              This will permanently delete their account and
              associated mess records.
            </p>

            {deleteError && (
              <div className="student-form-error" role="alert">
                {deleteError}
              </div>
            )}

            <div className="student-delete-actions">
              <button
                type="button"
                className="student-cancel-button"
                onClick={closeDeleteConfirmation}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="student-confirm-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
