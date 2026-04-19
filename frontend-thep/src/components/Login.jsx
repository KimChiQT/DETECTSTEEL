import React, { useState, useEffect } from 'react'

const CREDENTIALS = { username: 'admin', password: 'admin123' }

function IconEye({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function IconSpinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
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

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate network delay for UX
    await new Promise((r) => setTimeout(r, 900))

    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      // Always persist session; rememberMe controls long-term storage key
      localStorage.setItem('ds_logged_in', '1')
      if (rememberMe) {
        localStorage.setItem('ds_remember', '1')
      } else {
        localStorage.removeItem('ds_remember')
      }
      onLoginSuccess()
    } else {
      setError('Invalid username or password')
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-10">
      {/* Subtle background blobs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#1E3A8A]/5 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#06B6D4]/6 blur-3xl"
        aria-hidden
      />

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_20px_60px_rgba(16,24,40,0.10)] backdrop-blur-sm">
          {/* Top accent bar */}
          <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#06B6D4]" />

          <div className="px-8 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-8">
            {/* Logo + Title */}
            <div className="mb-7 flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E3A8A] text-sm font-black tracking-tight text-white shadow-md">
                ST
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Welcome Back
                </h1>
                <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="login-username"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError('') }}
                  placeholder="Enter your username"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15 hover:border-slate-300"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15 hover:border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                  >
                    {showPassword ? <IconEyeOff className="h-4.5 w-4.5" /> : <IconEye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-[#1E3A8A] cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-[#1E3A8A] transition-colors hover:text-[#172554] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition-all duration-200 hover:bg-[#172554] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <IconSpinner className="h-4 w-4" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="mt-6 text-center text-xs text-slate-400">
              DetectSteel &copy; {new Date().getFullYear()} &mdash; AI-powered steel defect inspection
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
