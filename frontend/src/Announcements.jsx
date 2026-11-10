import { useEffect, useState } from 'react'
import {
  addAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
} from './services/api'

function when(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Announcements() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setItems(await getAnnouncements())
    } catch (err) {
      setError(err.message || 'Unable to load notices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await addAnnouncement({
        title: title.trim(),
        message: message.trim(),
      })
      setTitle('')
      setMessage('')
      setNotice('Notice posted for students.')
      await load()
    } catch (err) {
      setError(err.message || 'Unable to post notice')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await deleteAnnouncement(id)
      setItems((current) => current.filter((item) => item._id !== id))
    } catch (err) {
      setError(err.message || 'Unable to remove notice')
    }
  }

  return (
    <div className="notice-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MESS BOARD</span>
          <h1>Notices</h1>
          <p>Post a short update that students can read after login.</p>
        </div>
      </div>

      <div className="notice-layout">
        <form className="notice-form" onSubmit={handleSubmit}>
          <h2>New notice</h2>
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              required
              placeholder="Mess timing change"
            />
          </label>
          <label>
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={500}
              required
              placeholder="Write a short announcement"
            />
          </label>
          <button className="gh-btn" type="submit" disabled={saving}>
            {saving ? 'Posting...' : 'Post notice'}
          </button>
        </form>

        <section className="notice-list">
          <h2>Published notices</h2>
          {notice && <p className="gh-ok">{notice}</p>}
          {error && <p className="gh-bad">{error}</p>}
          {loading && <p className="gh-muted">Loading notices...</p>}
          {!loading && items.length === 0 && (
            <p className="gh-muted">No notices yet.</p>
          )}
          {items.map((item) => (
            <article className="notice-card" key={item._id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{when(item.createdAt)}</small>
              </div>
              <button
                type="button"
                className="gh-text-btn"
                onClick={() => handleDelete(item._id)}
              >
                Remove
              </button>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
