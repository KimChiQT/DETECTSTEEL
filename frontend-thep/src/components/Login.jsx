import React, { useState, useEffect } from 'react'

const CREDENTIALS = { username: 'admin', password: 'admin123' }

function IconEye() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

/* Animated detection boxes for the left panel */
function DetectionBox({ style, label, color }) {
  return (
    <div
      className="pointer-events-none absolute rounded ds-detect-box"
      style={{ border: `2px solid ${color}`, ...style }}
      aria-hidden
    >
      <span
        className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
        style={{ background: color }}
      >
        {label}
      </span>
    </div>
  )
}

/* Left decorative panel */
function LeftPanel() {
  return (
    <div className="relative hidden h-full flex-col overflow-hidden bg-[#0f172a] lg:flex">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/hero-background.png')" }}
        aria-hidden
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/80 via-[#0f172a]/70 to-[#0f172a]/90" aria-hidden />

      {/* Scan line */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="ds-scanline"><div className="bar" /></div>
      </div>

      {/* Detection boxes mockup */}
      <DetectionBox style={{ left: '12%', top: '28%', width: 110, height: 80 }} label="Vết rạn 87%" color="#ef4444" />
      <DetectionBox style={{ right: '14%', top: '42%', width: 90, height: 65 }} label="Vảy cán 72%" color="#f59e0b" />
      <DetectionBox style={{ left: '22%', bottom: '28%', width: 80, height: 55 }} label="Đốm bề mặt 91%" color="#06b6d4" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xs font-black text-white backdrop-blur-sm ring-1 ring-white/20">
            ST
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-white">DETECTSTEEL</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-white/50">v1.0</div>
          </div>
        </div>

        {/* Center text */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">AI-Powered Inspection</span>
          </div>
          <h2 className="text-3xl font-black leading-tight text-white">
            Kiểm định lỗi thép<br />
            <span className="text-cyan-400">thông minh</span> với AI
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Phát hiện 6 loại khuyết tật bề mặt thép với độ chính xác cao, hỗ trợ quyết định AHP đa tiêu chí.
          </p>

          {/* Stats */}
          <div className="mt-6 flex gap-6">
            {[['6', 'Loại lỗi'], ['95%+', 'Chính xác'], ['Real-time', 'Phân tích']].map(([v, l]) => (
              <div key={l}>
                <div className="text-xl font-black text-white">{v}</div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-[11px] text-white/30">© 2025 DetectSteel AI — R&D Team</p>
      </div>
    </div>
  )
}

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      localStorage.setItem('ds_logged_in', '1')
      if (rememberMe) localStorage.setItem('ds_remember', '1')
      else localStorage.removeItem('ds_remember')
      onLoginSuccess()
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng.')
      setLoading(false)
    }
  }

  const inputBase =
    'w-full rounded-xl border bg-slate-50/80 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-300'
  const inputFocused = 'border-[#1E3A8A] bg-white ring-2 ring-[#1E3A8A]/12'
  const inputNormal = 'border-slate-200'

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-white">
      {/* Left panel — 2/5 width on large screens */}
      <div className="w-2/5 shrink-0">
        <LeftPanel />
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 py-12">
        {/* Subtle blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#1E3A8A]/5 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/6 blur-3xl" aria-hidden />

        <div
          className={`relative z-10 w-full max-w-sm transition-all duration-700 ease-out ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
          }`}
        >
          {/* Mobile logo (hidden on lg) */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E3A8A] text-sm font-black text-white shadow-lg">
              ST
            </div>
            <div className="text-center">
              <div className="text-lg font-extrabold tracking-tight text-[#1E3A8A]">DETECTSTEEL</div>
              <div className="text-xs text-slate-400">AI Steel Inspection</div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900">Đăng nhập</h1>
            <p className="mt-1 text-sm text-slate-500">Chào mừng trở lại! Vui lòng nhập thông tin.</p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="login-username" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tên đăng nhập
              </label>
              <div className="relative">
                <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'user' ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>
                  <IconUser />
                </span>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError('') }}
                  onFocus={() => setFocusedField('user')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin"
                  required
                  className={`${inputBase} ${focusedField === 'user' ? inputFocused : inputNormal}`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mật khẩu
              </label>
              <div className="relative">
                <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${focusedField === 'pass' ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>
                  <IconLock />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  required
                  className={`${inputBase} pr-11 ${focusedField === 'pass' ? inputFocused : inputNormal}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#1E3A8A]"
                />
                <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
              </label>
              <button type="button" className="text-sm font-medium text-[#1E3A8A] transition-colors hover:text-[#172554] hover:underline">
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-[#1E3A8A]/20 transition-all duration-200 hover:bg-[#172554] hover:shadow-xl hover:shadow-[#1E3A8A]/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <IconSpinner />
                  Đang đăng nhập…
                </>
              ) : (
                <>
                  Đăng nhập
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">Tài khoản demo</p>
            <p className="mt-0.5 font-mono text-xs text-slate-700">
              admin / admin123
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            DetectSteel © {new Date().getFullYear()} — AI-powered steel defect inspection
          </p>
        </div>
      </div>
    </div>
  )
}
