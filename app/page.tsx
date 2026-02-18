'use client'

import { useState, useEffect } from 'react'
import './styles.css'

interface Student {
  id: string
  name: string
  email: string
  phone: string
  country: string
  university: string
  program: string
  status: string
  deadline: string
}

interface University {
  id: string
  name: string
  country: string
  programs: number
  ranking: string
  deadline: string
}

interface Document {
  id: string
  name: string
  type: string
  status: string
  uploadDate: string
}

export default function ErasmusDashboard() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [students, setStudents] = useState<Student[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load data
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setStudents(data.students || [])
        setUniversities(data.universities || [])
        setDocuments(data.documents || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="loading">Loading Erasmus Dashboard...</div>
  }

  return (
    <div className="dashboard">
      <nav className="sidebar">
        <div className="logo">
          <h2>Erasmus+</h2>
          <p>Student Exchange Portal</p>
        </div>
        <ul className="nav-menu">
          <li className={currentView === 'dashboard' ? 'active' : ''} onClick={() => setCurrentView('dashboard')}>
            <span>📊</span> Dashboard
          </li>
          <li className={currentView === 'students' ? 'active' : ''} onClick={() => setCurrentView('students')}>
            <span>👨‍🎓</span> Students
          </li>
          <li className={currentView === 'universities' ? 'active' : ''} onClick={() => setCurrentView('universities')}>
            <span>🏛️</span> Universities
          </li>
          <li className={currentView === 'documents' ? 'active' : ''} onClick={() => setCurrentView('documents')}>
            <span>📄</span> Documents
          </li>
        </ul>
      </nav>

      <main className="main-content">
        <header className="header">
          <h1>Erasmus+ Dashboard</h1>
          <div className="user-info">
            <span>Admin User</span>
          </div>
        </header>

        {currentView === 'dashboard' && (
          <div className="view">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Students</h3>
                <p className="stat-number">{students.length}</p>
              </div>
              <div className="stat-card">
                <h3>Universities</h3>
                <p className="stat-number">{universities.length}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Documents</h3>
                <p className="stat-number">{documents.filter(d => d.status === 'pending').length}</p>
              </div>
              <div className="stat-card">
                <h3>Active Programs</h3>
                <p className="stat-number">{universities.reduce((sum, u) => sum + u.programs, 0)}</p>
              </div>
            </div>

            <div className="recent-activity">
              <h2>Recent Students</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>University</th>
                      <th>Program</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.slice(0, 5).map(student => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.university}</td>
                        <td>{student.program}</td>
                        <td><span className={`status ${student.status}`}>{student.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'students' && (
          <div className="view">
            <h2>Students Management</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Country</th>
                    <th>University</th>
                    <th>Status</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.country}</td>
                      <td>{student.university}</td>
                      <td><span className={`status ${student.status}`}>{student.status}</span></td>
                      <td>{student.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'universities' && (
          <div className="view">
            <h2>Partner Universities</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>University</th>
                    <th>Country</th>
                    <th>Programs</th>
                    <th>Ranking</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {universities.map(university => (
                    <tr key={university.id}>
                      <td>{university.name}</td>
                      <td>{university.country}</td>
                      <td>{university.programs}</td>
                      <td>{university.ranking}</td>
                      <td>{university.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'documents' && (
          <div className="view">
            <h2>Documents</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Upload Date</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td>{doc.name}</td>
                      <td>{doc.type}</td>
                      <td><span className={`status ${doc.status}`}>{doc.status}</span></td>
                      <td>{doc.uploadDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
