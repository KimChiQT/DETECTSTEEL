import React, { useEffect, useState } from 'react'
import './index.css'
import Header from './components/Header'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'
import History from './components/History'
import Stats from './components/Stats'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Footer from './components/Footer'
import Login from './components/Login'
import BatchAnalysis from './components/BatchAnalysis'

function App(){
  const [page, setPage] = useState('home')

  // ── Auth state ──────────────────────────────────────────
  // Check localStorage on first render so refresh keeps user logged in
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('ds_logged_in') === '1'
  )

  // "Bắt đầu ngay" → go to batch analysis if already logged in, else login
  const handleDemoAnalyze = async () => {
    if (isLoggedIn) {
      setPage('batch')
    } else {
      setPage('login')
    }
  }

  // Called after successful login → go to batch analysis
  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
    localStorage.setItem('ds_logged_in', '1')
    setPage('batch')
  }

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('ds_logged_in')
    localStorage.removeItem('ds_remember')
    setPage('home')
  }

  useEffect(()=>{
    if(page === 'dashboard'){
      setTimeout(()=>{
        const el = document.getElementById('dashboard-root')
        if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
    if(page === 'home'){
      setTimeout(()=>{
        const el = document.getElementById('home-hero')
        if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    }
    if(page === 'history'){
      setTimeout(()=>{
        const el = document.getElementById('history-root')
        if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    }
    if(page === 'stats'){
      setTimeout(()=>{
        const el = document.getElementById('stats-root')
        if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    }
  },[page])

  return (
    <div className={page === 'home' ? 'min-h-screen bg-white' : 'min-h-screen bg-white'}>
      {/* Login page has its own full-screen layout — no header */}
      {page === 'login' && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {page !== 'login' && <Header page={page} setPage={setPage} isLoggedIn={isLoggedIn} onLogout={handleLogout} onStart={handleDemoAnalyze} />}

      {page === 'home' && (
        <main className="flex flex-col">
          <Hero onDemo={handleDemoAnalyze} />
          <Features />
          <HowItWorks />
          <Footer />
        </main>
      )}

      {page === 'batch' && (
        <BatchAnalysis onGoAHP={() => setPage('dashboard')} />
      )}

      {page === 'dashboard' && (
        <div id="dashboard-root">
          <Dashboard />
        </div>
      )}

      {page === 'history' && (
        <History />
      )}
      {page === 'stats' && (
        <Stats onReanalyze={() => setPage('batch')} />
      )}
    </div>
  )
}

export default App
