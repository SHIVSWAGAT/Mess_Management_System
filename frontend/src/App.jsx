import { useEffect, useState } from 'react'
import Login from './login'
import Students from './Students'
import Menu from './Menu'
import Meals from './Meals'
import Expenses from './Expenses'
import Payments from './Payments'
import Feedback from './Feedback'
import Reports from './Reports'
import Announcements from './Announcements'
import StudentPortal from './StudentPortal'
import { getStudentCount, getWeeklyMenu, getMonthlyMealCount, getExpenses, getLoggedInUser, logoutUser } from './services/api'
import './App.css'

const NAVIGATION = [['Dashboard', 'Overview'], ['Mess Menu', 'Weekly menu'], ['Students', 'Students'], ['Meals', 'Meals'], ['Payments', 'Payments'], ['Expenses', 'Expenses'], ['Feedback', 'Feedback'], ['Notices', 'Notices'], ['Reports', 'Reports']]
const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner']

function App() {
  const [currentUser, setCurrentUser] = useState(getLoggedInUser)
  const [page, setPage] = useState('Dashboard')
  const [navOpen, setNavOpen] = useState(false)
  const [summary, setSummary] = useState({ students: null, meals: null, expenses: null, menu: null })
  const [loading, setLoading] = useState(false)
  const todayName = new Date().toLocaleDateString('en-IN', { weekday: 'long' })
  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  const loadSummary = async () => {
    setLoading(true)
    const [students, meals, expenses, menu] = await Promise.allSettled([getStudentCount(), getMonthlyMealCount(), getExpenses(), getWeeklyMenu()])
    setSummary({
      students: students.status === 'fulfilled' ? students.value : null,
      meals: meals.status === 'fulfilled' ? meals.value : null,
      expenses: expenses.status === 'fulfilled' ? expenses.value.total : null,
      menu: menu.status === 'fulfilled' ? menu.value.find((item) => item.day === todayName) || null : null,
    })
    setLoading(false)
  }

  useEffect(() => { if (currentUser?.role === 'admin' && page === 'Dashboard') loadSummary() }, [currentUser?.role, page])
  const logout = () => { logoutUser(); setCurrentUser(null); setPage('Dashboard') }
  if (!currentUser) return <Login onLogin={() => setCurrentUser(getLoggedInUser())} />
  if (currentUser.role === 'user') return <StudentPortal currentUser={currentUser} onLogout={logout} />
  if (currentUser.role !== 'admin') return <Login onLogin={() => setCurrentUser(getLoggedInUser())} />

  const renderPage = () => {
    if (page === 'Mess Menu') return <Menu />
    if (page === 'Students') return <Students />
    if (page === 'Meals') return <Meals />
    if (page === 'Payments') return <Payments />
    if (page === 'Expenses') return <Expenses />
    if (page === 'Feedback') return <Feedback />
    if (page === 'Notices') return <Announcements />
    if (page === 'Reports') return <Reports />
    return <AdminDashboard summary={summary} todayName={todayName} loading={loading} goTo={setPage} />
  }

  return <div className="gh-app">
    <header className="gh-header"><div className="gh-brand"><div className="gh-mark">DD</div><div><strong>DineDesk</strong><small>Your Mess. Your Menu. Your Convenience.</small></div></div><div className="gh-header-actions"><span className="gh-date">{dateLabel}</span><button className="gh-logout" onClick={logout}>Sign out</button><button className="gh-menu-btn" onClick={() => setNavOpen((value) => !value)}>Menu</button></div></header>
    <div className="gh-admin-layout">
      <nav className={`gh-nav ${navOpen ? 'open' : ''}`} aria-label="Admin navigation">{NAVIGATION.map(([name, label]) => <button key={name} className={page === name ? 'active' : ''} aria-current={page === name ? 'page' : undefined} onClick={() => { setPage(name); setNavOpen(false) }}><span>{label}</span></button>)}</nav>
      <main className="gh-main">{renderPage()}<footer className="gh-footer"><span>© {new Date().getFullYear()} DineDesk</span><span>Your Mess. Your Menu. Your Convenience.</span></footer></main>
    </div>
  </div>
}

function AdminDashboard({ summary, todayName, loading, goTo }) {
  const menu = summary.menu
  return <><span className="gh-kicker">Admin workspace</span><h1>Mess, made manageable.</h1><p className="gh-lead">A focused view of students, meals, menus and the day-to-day mess desk.</p>
    <section className="gh-stats"><Stat label="Registered students" value={summary.students ?? '—'} /><Stat label="Meals recorded" value={summary.meals ?? '—'} /><Stat label="Monthly expenses" value={summary.expenses === null ? '—' : `₹${Number(summary.expenses).toLocaleString('en-IN')}`} /><Stat label="Today’s menu" value={menu ? 'Published' : 'Not yet'} /></section>
    <section className="gh-split"><article className="gh-card"><h2>Today’s menu · {todayName}</h2>{loading ? <p>Loading live mess data…</p> : menu ? <div className="meal-grid">{MEALS.map((meal) => <div className="meal-tile" key={meal}><strong>{meal}</strong><span>{Array.isArray(menu[meal]) ? menu[meal].join(', ') || 'Not added' : menu[meal] || 'Not added'}</span></div>)}</div> : <p>No menu is published for today. Add one from the weekly menu.</p>}</article><article className="gh-card"><h2>Quick actions</h2><div className="gh-links"><button onClick={() => goTo('Mess Menu')}>Publish weekly menu <span>→</span></button><button onClick={() => goTo('Students')}>Manage students <span>→</span></button><button onClick={() => goTo('Feedback')}>Review feedback <span>→</span></button><button onClick={() => goTo('Notices')}>Post a notice <span>→</span></button></div></article></section>
  </>
}
function Stat({ label, value }) { return <article className="gh-stat"><span>{label}</span><strong>{value}</strong></article> }
export default App
