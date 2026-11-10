import { useEffect, useState } from 'react'
import { addFeedback, getAnnouncements, getMyComplaints, getMyMeals, getMyPayments, getStudentDashboard, getWeeklyMenu } from './services/api'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const PAGES = ['Dashboard', 'Mess Menu', 'My Meals', 'My Payments', 'Feedback', 'Notices', 'My Profile']
const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner']
const emptyForm = { type: 'Complaint', category: 'Food Quality', subject: '', description: '', rating: '' }
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`
const dateText = (value) => value ? new Date(value).toLocaleDateString('en-IN') : '—'

export default function StudentPortal({ currentUser, onLogout }) {
  const [page, setPage] = useState('Dashboard')
  const [data, setData] = useState({ dashboard: null, meals: [], payments: [], complaints: [], menu: [], notices: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(emptyForm)
  const load = async () => {
    setLoading(true); setError('')
    const results = await Promise.allSettled([getStudentDashboard(), getMyMeals(), getMyPayments(), getMyComplaints(), getWeeklyMenu(), getAnnouncements()])
    const failed = results.filter((result) => result.status === 'rejected').length
    setData({ dashboard: results[0].status === 'fulfilled' ? results[0].value : null, meals: results[1].status === 'fulfilled' ? results[1].value : [], payments: results[2].status === 'fulfilled' ? results[2].value : [], complaints: results[3].status === 'fulfilled' ? results[3].value : [], menu: results[4].status === 'fulfilled' ? results[4].value : [], notices: results[5].status === 'fulfilled' ? results[5].value : [] })
    if (failed) setError('Some records could not be loaded. Refresh to try again.')
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const submit = async (event) => {
    event.preventDefault(); setError(''); setNotice('')
    try { await addFeedback({ ...form, subject: form.subject.trim(), description: form.description.trim(), rating: form.rating ? Number(form.rating) : null }); setForm(emptyForm); setNotice('Your submission was sent to the mess admin.'); await load() } catch (err) { setError(err.message || 'Unable to submit your feedback.') }
  }
  const student = data.dashboard?.student || currentUser
  const totalMeals = data.meals.reduce((sum, item) => sum + Number(item.numberOfMeal || 0), 0)
  const totalPayments = data.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const pending = data.complaints.filter((item) => item.type === 'Complaint' && item.status !== 'Resolved').length
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long' })
  return <div className="gh-app"><header className="gh-header"><div className="gh-brand"><div className="gh-mark">DD</div><div><strong>DineDesk</strong><small>Your Mess. Your Menu. Your Convenience.</small></div></div><div className="gh-header-actions"><span className="gh-date">Welcome, {student?.username || 'Student'}</span><button className="gh-logout" onClick={onLogout}>Sign out</button></div></header>
    <nav className="gh-nav student-nav">{PAGES.map((name) => <button key={name} className={name === page ? 'active' : ''} onClick={() => setPage(name)}>{name}</button>)}</nav>
    <main className="gh-main"><span className="gh-kicker">Student workspace</span><h1>{page}</h1><p className="gh-lead">Your meals, mess updates and a direct line to the mess administrator.</p>{error && <p className="gh-bad">{error}</p>}{notice && <p className="gh-ok">{notice}</p>}{loading && <p className="gh-muted">Loading your mess records…</p>}
      {page === 'Dashboard' && <Dashboard totalMeals={totalMeals} totalPayments={totalPayments} pending={pending} menu={data.menu.find((item) => item.day === today)} notices={data.notices} />}
      {page === 'Mess Menu' && <MenuBoard menu={data.menu} />}
      {page === 'My Meals' && <History title="My meal history" rows={data.meals} columns={[['Date', (item) => dateText(item.date)], ['Meals', (item) => item.numberOfMeal || 0]]} />}
      {page === 'My Payments' && <History title="My payment history" rows={data.payments} columns={[['Date', (item) => dateText(item.date)], ['Amount', (item) => money(item.amount)]]} />}
      {page === 'Feedback' && <Feedback form={form} setForm={setForm} items={data.complaints} submit={submit} />}
      {page === 'Notices' && <Notices items={data.notices} />}
      {page === 'My Profile' && <Profile student={student} mess={currentUser.messusername} />}
      <footer className="gh-footer"><span>© {new Date().getFullYear()} DineDesk</span><button className="gh-text-btn" onClick={load}>Refresh records</button></footer></main></div>
}

function Dashboard({ totalMeals, totalPayments, pending, menu, notices }) { return <><section className="gh-stats"><Stat label="Meals recorded" value={totalMeals} /><Stat label="Payments made" value={money(totalPayments)} /><Stat label="Open complaints" value={pending} /><Stat label="New notices" value={notices.length} /></section><section className="gh-split"><article className="gh-card"><h2>Today’s menu</h2>{menu ? <div className="meal-grid">{MEALS.map((meal) => <div className="meal-tile" key={meal}><strong>{meal}</strong><span>{menu[meal]?.join(', ') || 'Not added'}</span></div>)}</div> : <p>No menu has been published for today.</p>}</article><article className="gh-card"><h2>Latest notice</h2>{notices[0] ? <><strong>{notices[0].title}</strong><p>{notices[0].message}</p></> : <p>No notices from the mess desk yet.</p>}</article></section></> }
function Stat({ label, value }) { return <article className="gh-stat"><span>{label}</span><strong>{value}</strong></article> }
function MenuBoard({ menu }) { return <section className="day-board">{DAYS.map((day) => { const current = menu.find((item) => item.day === day); return <article key={day}><h3>{day}</h3>{current ? MEALS.map((meal) => <p key={meal}><strong>{meal}: </strong>{current[meal]?.join(', ') || 'Not added'}</p>) : <p className="gh-muted">No menu published.</p>}</article> })}</section> }
function History({ title, rows, columns }) { return <article className="gh-card"><h2>{title}</h2>{rows.length ? <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr>{columns.map(([name]) => <th key={name}>{name}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row._id}>{columns.map(([name, get]) => <td key={name}>{get(row)}</td>)}</tr>)}</tbody></table></div> : <p className="gh-muted">No records found.</p>}</article> }
function Feedback({ form, setForm, items, submit }) { return <section className="student-grid"><form className="gh-card stack-form" onSubmit={submit}><h2>Send feedback or a complaint</h2><label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Complaint</option><option>Feedback</option></select></label><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{['Food Quality', 'Hygiene', 'Taste', 'Quantity', 'Service', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Subject<input required maxLength="150" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label><label>Description<textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label>Rating (optional)<select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}><option value="">No rating</option>{[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number} star</option>)}</select></label><button className="gh-btn">Submit</button></form><article className="gh-card"><h2>My submissions</h2>{items.length ? items.map((item) => <div className="submission" key={item._id}><strong>{item.subject}</strong><p>{item.type} · {item.category}</p><p>{item.description}</p><span className={`status-chip ${item.status === 'Resolved' ? 'done' : ''}`}>{item.status}</span>{item.adminResponse && <p className="reply"><strong>Admin response: </strong>{item.adminResponse}</p>}</div>) : <p className="gh-muted">Your submitted feedback will appear here.</p>}</article></section> }
function Notices({ items }) { return <section className="day-board">{items.length ? items.map((item) => <article key={item._id}><h3>{item.title}</h3><p>{item.message}</p><small>{dateText(item.createdAt)}</small></article>) : <p className="gh-muted">No notices have been posted.</p>}</section> }
function Profile({ student, mess }) { return <article className="gh-card"><h2>My profile</h2>{[['Name', student?.username], ['Email', student?.email], ['Roll number', student?.rollNumber], ['Department', student?.department], ['Hostel', student?.hostel], ['Room', student?.roomNumber], ['Mess', mess]].map(([label, value]) => <div className="profile-row" key={label}><span>{label}</span><strong>{value || '—'}</strong></div>)}</article> }
