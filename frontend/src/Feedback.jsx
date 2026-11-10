
import { useEffect, useMemo, useState } from 'react';
import {
  getStudents,
  getAllFeedback,
  getFeedbackStats,
  updateFeedback,
  deleteFeedback,
} from './services/api';
import './Feedback.css';

function Feedback() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [status, setStatus] = useState('Pending');
  const [adminResponse, setAdminResponse] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [feedbackData, studentData, statsData] =
        await Promise.all([
          getAllFeedback(),
          getStudents(),
          getFeedbackStats(),
        ]);

      setRecords(feedbackData);
      setStudents(studentData);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Unable to load feedback');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const studentMap = useMemo(() => {
    return new Map(
      students.map((student) => [
        String(student._id),
        student,
      ])
    );
  }, [students]);

  function getStudentName(record) {
    const student = studentMap.get(String(record.userId));

    return (
      student?.username ||
      student?.name ||
      record.username ||
      record.email ||
      'Unknown Student'
    );
  }

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return records.filter((record) => {
      const student = studentMap.get(String(record.userId));

      const studentName =
        student?.username ||
        student?.name ||
        record.username ||
        '';

      const text = [
        studentName,
        student?.email,
        record.email,
        record.subject,
        record.description,
        record.category,
        record.type,
        record.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = text.includes(keyword);

      const matchesFilter =
        filter === 'All' ||
        record.status === filter ||
        record.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [records, search, filter, studentMap]);

  function openEdit(record) {
    setEditing(record);
    setStatus(record.status || 'Pending');
    setAdminResponse(record.adminResponse || '');
    setError('');
    setNotice('');
  }

  function closeModals() {
    if (saving) return;

    setEditing(null);
    setDeleting(null);
  }

  async function handleUpdate(event) {
    event.preventDefault();

    if (!editing) return;

    try {
      setSaving(true);
      setError('');

      await updateFeedback(editing._id, {
        status,
        adminResponse: adminResponse.trim(),
      });

      setEditing(null);
      await loadData();
      setNotice('Complaint updated successfully');
    } catch (err) {
      setError(err.message || 'Unable to update feedback');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      setSaving(true);
      setError('');

      await deleteFeedback(deleting._id);

      setDeleting(null);
      await loadData();
      setNotice('Feedback deleted successfully');
    } catch (err) {
      setError(err.message || 'Unable to delete feedback');
    } finally {
      setSaving(false);
    }
  }

  function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const statCards = [
    {
      label: 'Total Submissions',
      value: stats?.total ?? records.length,
      icon: '◈',
      color: 'purple',
    },
    {
      label: 'Pending',
      value:
        stats?.pending ??
        records.filter((r) => r.status === 'Pending').length,
      icon: '◷',
      color: 'orange',
    },
    {
      label: 'Resolved',
      value:
        stats?.resolved ??
        records.filter((r) => r.status === 'Resolved').length,
      icon: '✓',
      color: 'green',
    },
    {
      label: 'Average Rating',
      value: stats?.averageRating
        ? `${stats.averageRating}/5`
        : '—',
      icon: '★',
      color: 'blue',
    },
  ];

  return (
    <div className="feedback-page">
      <div className="feedback-heading">
        <div>
          <span className="feedback-eyebrow">
            STUDENT EXPERIENCE
          </span>

          <h1>Feedback & Complaints</h1>

          <p>
            Listen to students, resolve concerns, and
            improve campus dining.
          </p>
        </div>
      </div>

      <div className="feedback-stats">
        {statCards.map((card) => (
          <div
            className="feedback-stat-card"
            key={card.label}
          >
            <span
              className={`feedback-stat-icon ${card.color}`}
            >
              {card.icon}
            </span>

            <span className="feedback-stat-label">
              {card.label}
            </span>

            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      {notice && (
        <div className="feedback-success">
          {notice}
          <button onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      )}

      {error && !editing && !deleting && (
        <div className="feedback-error">
          {error}
          <button onClick={() => setError('')}>
            ×
          </button>
        </div>
      )}

      <div className="feedback-panel">
        <div className="feedback-panel-top">
          <div>
            <h2>Student Submissions</h2>
            <p>
              {filteredRecords.length} records displayed
            </p>
          </div>

          <button
            className="feedback-refresh"
            onClick={loadData}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="feedback-toolbar">
          <input
            type="search"
            placeholder="Search student, subject, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Submissions</option>
            <option value="Complaint">Complaints</option>
            <option value="Feedback">Feedback</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {loading ? (
          <div className="feedback-empty">
            Loading feedback records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="feedback-empty">
            <span>✉</span>
            <h3>No submissions found</h3>
            <p>
              New student feedback and complaints will
              appear here.
            </p>
          </div>
        ) : (
          <div className="feedback-table-wrap">
            <table className="feedback-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Submission</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <strong>
                        {getStudentName(record)}
                      </strong>
                    </td>

                    <td>
                      <div className="feedback-subject">
                        <strong>{record.subject}</strong>
                        <span>{record.description}</span>
                        <small>
                          {record.type}
                          {record.adminResponse
                            ? ' · Admin replied'
                            : ''}
                        </small>
                      </div>
                    </td>

                    <td>{record.category}</td>

                    <td>
                      {record.rating != null
                        ? `★ ${record.rating}/5`
                        : '—'}
                    </td>

                    <td>
                      <span
                        className={`feedback-status ${
                          record.status === 'Resolved'
                            ? 'resolved'
                            : record.status === 'In Progress'
                              ? 'progress'
                              : 'pending'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>

                    <td>
                      {formatDate(record.createdAt)}
                    </td>

                    <td>
                      <div className="feedback-actions">
                        <button
                          onClick={() => openEdit(record)}
                        >
                          Manage
                        </button>

                        <button
                          className="feedback-delete-action"
                          onClick={() => {
                            setError('');
                            setDeleting(record);
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

      {editing && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal">
            <div className="feedback-modal-header">
              <div>
                <h2>Manage Submission</h2>
                <p>{editing.subject}</p>
              </div>

              <button onClick={closeModals}>
                ×
              </button>
            </div>

            <div className="feedback-detail-box">
              <strong>
                {getStudentName(editing)}
              </strong>

              <p>{editing.description}</p>

              <small>
                {editing.type} · {editing.category}
              </small>
            </div>

            <form onSubmit={handleUpdate}>
              <label>
                Complaint Status

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              </label>

              <label>
                Admin Response

                <textarea
                  rows={4}
                  placeholder="Write a response to the student..."
                  value={adminResponse}
                  onChange={(e) =>
                    setAdminResponse(e.target.value)
                  }
                />
              </label>

              {error && (
                <div className="feedback-error">
                  {error}
                </div>
              )}

              <div className="feedback-modal-footer">
                <button
                  type="button"
                  className="feedback-secondary-btn"
                  onClick={closeModals}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="feedback-primary-btn"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal feedback-small-modal">
            <div className="feedback-modal-header">
              <div>
                <h2>Delete Submission?</h2>
                <p>This action cannot be undone.</p>
              </div>

              <button onClick={closeModals}>
                ×
              </button>
            </div>

            <p>
              Are you sure you want to delete
              <strong> {deleting.subject}</strong>?
            </p>

            {error && (
              <div className="feedback-error">
                {error}
              </div>
            )}

            <div className="feedback-modal-footer">
              <button
                className="feedback-secondary-btn"
                onClick={closeModals}
              >
                Cancel
              </button>

              <button
                className="feedback-danger-btn"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Feedback;
