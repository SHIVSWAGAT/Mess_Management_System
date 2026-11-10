
import { useEffect, useMemo, useState } from 'react'
import {
  getStudents,
  getMeals,
  getExpenses,
  getPayments,
  getAvailableBalance,
} from './services/api'
import './Reports.css'

const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`

function Reports() {
  const [students, setStudents] = useState([])
  const [meals, setMeals] = useState([])
  const [expenses, setExpenses] = useState([])
  const [payments, setPayments] = useState([])
  const [availableBalance, setAvailableBalance] = useState(0)
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const monthLabel = new Date().toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  async function loadReports() {
    setLoading(true)
    setError('')

    const results = await Promise.allSettled([
      getStudents(),
      getMeals(),
      getExpenses(),
      getPayments(),
      getAvailableBalance(),
    ])

    const errors = []

    if (results[0].status === 'fulfilled') {
      setStudents(results[0].value)
    } else {
      errors.push('Students')
    }

    if (results[1].status === 'fulfilled') {
      setMeals(results[1].value)
    } else {
      errors.push('Meals')
    }

    if (results[2].status === 'fulfilled') {
      setExpenses(results[2].value.expenses)
      setExpenseTotal(results[2].value.total)
    } else {
      errors.push('Expenses')
    }

    if (results[3].status === 'fulfilled') {
      setPayments(results[3].value)
    } else {
      errors.push('Payments')
    }

    if (results[4].status === 'fulfilled') {
      setAvailableBalance(results[4].value)
    } else {
      errors.push('Balance')
    }

    if (errors.length) {
      setError(`Unable to load: ${errors.join(', ')}`)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadReports()
  }, [])

  const totalMeals = useMemo(
    () =>
      meals.reduce(
        (sum, item) => sum + Number(item.numberOfMeal || 0),
        0
      ),
    [meals]
  )

  const totalCollections = useMemo(
    () =>
      payments.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ),
    [payments]
  )

  const studentMap = useMemo(
    () =>
      new Map(
        students.map((student) => [
          String(student._id),
          student.username || student.name || student.email,
        ])
      ),
    [students]
  )

  const expenseByCategory = useMemo(() => {
    const totals = {}

    expenses.forEach((item) => {
      const category =
        item.categoryName ||
        item.categoryId?.name ||
        item.category?.name ||
        'Other'

      totals[category] =
        (totals[category] || 0) + Number(item.amount || 0)
    })

    return Object.entries(totals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses])

  const topPayments = useMemo(
    () =>
      [...payments]
        .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
        .slice(0, 5),
    [payments]
  )

  const maxExpense = Math.max(
    1,
    ...expenseByCategory.map((item) => item.amount)
  )

  const stats = [
    {
      title: 'Registered Students',
      value: students.length,
      note: 'Total student accounts',
      icon: '♙',
      color: 'green',
    },
    {
      title: 'Meals Served',
      value: totalMeals,
      note: 'Current month',
      icon: '◷',
      color: 'orange',
    },
    {
      title: 'Monthly Expenses',
      value: money(expenseTotal),
      note: 'Current month',
      icon: '▤',
      color: 'purple',
    },
    {
      title: 'Monthly Collections',
      value: money(totalCollections),
      note: 'Current month',
      icon: '₹',
      color: 'blue',
    },
  ]

  function exportCSV() {
    const rows = [
      ['DineDesk Monthly Report', monthLabel],
      [],
      ['Metric', 'Value'],
      ['Registered Students', students.length],
      ['Meals Served', totalMeals],
      ['Monthly Expenses', expenseTotal],
      ['Monthly Collections', totalCollections],
      ['Available Balance', availableBalance],
      [],
      ['Expense Category', 'Amount'],
      ...expenseByCategory.map((item) => [
        item.name,
        item.amount,
      ]),
    ]

    const csv = rows
      .map((row) =>
        row
          .map((cell) =>
            `"${String(cell ?? '').replace(/"/g, '""')}"`
          )
          .join(',')
      )
      .join('\r\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `DineDesk_Report_${new Date()
      .toISOString()
      .slice(0, 7)}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="reports-page">
      <div className="reports-heading">
        <div>
          <span className="reports-eyebrow">
            MESS PERFORMANCE
          </span>
          <h1>Reports & Analytics</h1>
          <p>
            Your campus mess performance overview for {monthLabel}.
          </p>
        </div>

        <div className="reports-heading-actions">
          <button
            className="reports-secondary-btn"
            onClick={loadReports}
            disabled={loading}
          >
            ↻ Refresh
          </button>
          <button
            className="reports-primary-btn"
            onClick={exportCSV}
            disabled={loading || Boolean(error)}
          >
            ↓ Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="reports-error">
          {error}. Refresh to retry.
        </div>
      )}

      {loading ? (
        <div className="reports-loading">
          Loading analytics from MongoDB...
        </div>
      ) : (
        <>
          <div className="reports-stats-grid">
            {stats.map((stat) => (
              <div className="reports-stat-card" key={stat.title}>
                <span className={`reports-stat-icon ${stat.color}`}>
                  {stat.icon}
                </span>
                <span className="reports-stat-title">
                  {stat.title}
                </span>
                <strong>{stat.value}</strong>
                <small>{stat.note}</small>
              </div>
            ))}
          </div>

          <div className="reports-panels">
            <section className="reports-panel">
              <div className="reports-panel-header">
                <div>
                  <h2>Financial Overview</h2>
                  <p>Current month · MongoDB records</p>
                </div>
              </div>

              <div className="reports-finance-row">
                <span>Total Collections</span>
                <strong>{money(totalCollections)}</strong>
              </div>

              <div className="reports-finance-row">
                <span>Total Expenses</span>
                <strong>{money(expenseTotal)}</strong>
              </div>

              <div className="reports-finance-row reports-balance-row">
                <span>Available Mess Balance</span>
                <strong>{money(availableBalance)}</strong>
              </div>

              <p className="reports-info">
                Available balance is calculated by the backend
                from monthly collections and expenses.
              </p>
            </section>

            <section className="reports-panel">
              <div className="reports-panel-header">
                <div>
                  <h2>Expense Breakdown</h2>
                  <p>Spending by category</p>
                </div>
              </div>

              {expenseByCategory.length === 0 ? (
                <p className="reports-empty">
                  No expense records for this month.
                </p>
              ) : (
                <div className="reports-bars">
                  {expenseByCategory.map((item) => (
                    <div
                      className="reports-bar-item"
                      key={item.name}
                    >
                      <div className="reports-bar-label">
                        <span>{item.name}</span>
                        <strong>{money(item.amount)}</strong>
                      </div>

                      <div className="reports-bar-track">
                        <div
                          className="reports-bar-fill"
                          style={{
                            width: `${
                              (item.amount / maxExpense) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="reports-panel reports-payments-panel">
            <div className="reports-panel-header">
              <div>
                <h2>Top Payment Records</h2>
                <p>Highest payments recorded this month</p>
              </div>
            </div>

            {topPayments.length === 0 ? (
              <p className="reports-empty">
                No payment records available.
              </p>
            ) : (
              <div className="reports-table-wrap">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPayments.map((payment) => (
                      <tr key={payment._id}>
                        <td>
                          {payment.username ||
                            payment.userId?.username ||
                            studentMap.get(
                              String(
                                payment.userId?._id ||
                                payment.userId
                              )
                            ) ||
                            'Student'}
                        </td>
                        <td>{money(payment.amount)}</td>
                        <td>
                          {payment.date
                            ? new Date(
                                payment.date
                              ).toLocaleDateString('en-IN')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default Reports
