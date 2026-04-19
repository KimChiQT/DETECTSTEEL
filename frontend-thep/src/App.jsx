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

const PROTECTED_PAGES = ['batch', 'dashboard', 'history', 'stats']

/* Modal yêu cầu đăng nhập */
function LoginRequiredModal({ onLogin, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
          🔒
        </div>
        <h3 className="text-base font-bold text-slate-900">Yêu cầu đăng nhập</h3>
        <p className="mt-1 text-sm text-slate-500">
          Bạn cần đăng nhập để sử dụng tính năng này.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onLogin}
            className="flex-1 rounded-xl bg-[#1E3A8A] py-2.5 text-sm font-bold text-white transition hover:bg-[#172554]"
          >
            Đăng nhập ngay
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  )
}

function App(){
  const [page, setPage] = useState('home')
  const [showLoginModal, setShowLoginModal] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('ds_logged_in') === '1'
  )

  // Intercept setPage — chặn protected pages khi chưa login
  const navigate = (target) => {
    if (PROTECTED_PAGES.includes(target) && !isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    setShowLoginModal(false)
    setPage(target)
  }

  const handleDemoAnalyze = () => navigate('batch')

  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
    localStorage.setItem('ds_logged_in', '1')
    setShowLoginModal(false)
    setPage('batch')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('ds_logged_in')
    localStorage.removeItem('ds_remember')
    setPage('home')
  }

  // Safety net: nếu page bị set thành protected khi chưa login → redirect
  useEffect(() => {
    if (PROTECTED_PAGES.includes(page) && !isLoggedIn) {
      setPage('home')
    }
  }, [page, isLoggedIn])

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
    <div className="min-h-screen bg-white">
      {/* Login modal khi chưa đăng nhập */}
      {showLoginModal && (
        <LoginRequiredModal
          onLogin={() => { setShowLoginModal(false); setPage('login') }}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Login page — full screen, không có header */}
      {page === 'login' && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {page !== 'login' && (
        <Header
          page={page}
          setPage={navigate}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onStart={handleDemoAnalyze}
        />
      )}

      {page === 'home' && (
        <main className="flex flex-col">
          <Hero onDemo={handleDemoAnalyze} />
          <Features />
          <HowItWorks />
          <Footer />
        </main>
      )}

      {page === 'batch' && isLoggedIn && (
        <BatchAnalysis onGoAHP={() => navigate('dashboard')} />
      )}

      {page === 'dashboard' && isLoggedIn && (
        <div id="dashboard-root">
          <Dashboard />
        </div>
      )}

      {page === 'history' && isLoggedIn && (
        <History />
      )}

      {page === 'stats' && isLoggedIn && (
        <Stats onReanalyze={() => navigate('batch')} />
      )}
    </div>
  )
}

export default App
