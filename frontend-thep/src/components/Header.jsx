import React from 'react'

function IconHome({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M3 10.5 12 3 21 10.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconFolder({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeLinejoin="round" />
    </svg>
  )
}

function IconChart({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 19V5M4 19h16M8 17V9m4 8V6m4 11v-5" strokeLinecap="round" />
    </svg>
  )
}

function IconLayers({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

const navBtn =
  'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900 hover:shadow-sm md:gap-2 md:px-3.5 md:py-2 md:text-sm'

const navBtnActive = 'bg-white text-[#1E3A8A] shadow-sm ring-1 ring-slate-200/80'

export default function Header({ page, setPage, isLoggedIn, onLogout, onStart }) {
  const goDashboard = () => {
    if (onStart) onStart()
    else setPage('login')
  }

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 md:gap-4 md:px-6 md:py-2.5">
        <button
          type="button"
          onClick={() => setPage('home')}
          className="flex shrink-0 items-center gap-3 text-left transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1E3A8A] text-[10px] font-black tracking-tight text-white shadow-sm md:h-9 md:w-9 md:rounded-lg md:text-xs">
            ST
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight text-[#1E3A8A] md:text-[15px]">DETECTSTEEL</div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 md:text-[10px]">v1.0</div>
          </div>
        </button>

        <nav
          className="hidden min-w-0 flex-1 justify-center md:flex"
          aria-label="Điều hướng chính"
        >
          <div className="inline-flex items-center gap-0.5 rounded-full border border-slate-200/90 bg-slate-100/95 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setPage('home')}
              className={`${navBtn} ${page === 'home' ? navBtnActive : ''}`}
            >
              <IconHome className="h-4 w-4 text-sky-600" />
              Trang chủ
            </button>
            <button
              type="button"
              onClick={() => setPage('history')}
              className={`${navBtn} ${page === 'history' ? navBtnActive : ''}`}
            >
              <IconFolder className="h-4 w-4 text-amber-600" />
              Lịch sử
            </button>
            <button
              type="button"
              onClick={() => setPage('batch')}
              className={`${navBtn} ${page === 'batch' ? navBtnActive : ''}`}
            >
              <IconLayers className="h-4 w-4 text-violet-600" />
              Phân tích Lô
            </button>
            <button
              type="button"
              onClick={() => setPage('stats')}
              className={`${navBtn} ${page === 'stats' ? navBtnActive : ''}`}
            >
              <IconChart className="h-4 w-4 text-emerald-600" />
              Thống kê
            </button>
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {isLoggedIn ? (
            <>
              {/* User badge */}
              <div className="hidden items-center gap-2 md:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E3A8A] text-[10px] font-black text-white">
                  A
                </div>
                <span className="text-xs font-semibold text-slate-700">admin</span>
              </div>
              {/* Go to dashboard */}
              <button
                type="button"
                onClick={goDashboard}
                className="hidden rounded-lg bg-[#1E3A8A] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#172554] hover:shadow-lg md:inline-flex md:rounded-xl md:px-5 md:py-2.5 md:text-xs"
              >
                PHÂN TÍCH LÔ MỚI
              </button>
              <button
                type="button"
                onClick={goDashboard}
                className="inline-flex rounded-lg bg-[#1E3A8A] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white shadow-md md:hidden"
              >
                PHÂN TÍCH
              </button>
              {/* Logout */}
              <button
                type="button"
                onClick={onLogout}
                title="Đăng xuất"
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={goDashboard}
                className="hidden rounded-lg bg-[#1E3A8A] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#172554] hover:shadow-lg md:inline-flex md:rounded-xl md:px-5 md:py-2.5 md:text-xs"
              >
                BẮT ĐẦU NGAY
              </button>
              <button
                type="button"
                onClick={goDashboard}
                className="inline-flex rounded-lg bg-[#1E3A8A] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white shadow-md md:hidden"
              >
                BẮT ĐẦU
              </button>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-1 md:hidden">
        <div className="mx-auto flex max-w-7xl justify-center gap-1 overflow-x-auto">
          <button type="button" onClick={() => setPage('home')} className={`${navBtn} text-xs ${page === 'home' ? navBtnActive : ''}`}>
            <IconHome className="h-3.5 w-3.5" /> Trang chủ
          </button>
          <button type="button" onClick={() => setPage('history')} className={`${navBtn} text-xs ${page === 'history' ? navBtnActive : ''}`}>
            <IconFolder className="h-3.5 w-3.5" /> Lịch sử
          </button>
          <button type="button" onClick={() => setPage('batch')} className={`${navBtn} text-xs ${page === 'batch' ? navBtnActive : ''}`}>
            <IconLayers className="h-3.5 w-3.5" /> Phân tích Lô
          </button>
          <button type="button" onClick={() => setPage('stats')} className={`${navBtn} text-xs ${page === 'stats' ? navBtnActive : ''}`}>
            <IconChart className="h-3.5 w-3.5" /> Thống kê
          </button>
        </div>
      </div>
    </header>
  )
}
