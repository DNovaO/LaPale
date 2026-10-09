const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000
const LAST_ACTIVITY_KEY = 'last_activity_at'
const REDIRECT_GUARD_KEY = 'session_expired_redirecting'
const EXPIRED_REASON_KEY = 'session_expired_reason'

const snapshotHandlers = new Set()
let watchStarted = false

export const SESSION_EXPIRED_MESSAGE = 'Tu sesión terminó, inicia sesión de nuevo.'

export function isSessionExpiredError(err) {
  return err?.response?.status === 401
}

export function touchActivity() {
  try {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('token')) return
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
  } catch { /* empty */ }
}

export function clearActivity() {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY)
  } catch { /* empty */ }
}

export function registerSessionSnapshot(fn) {
  snapshotHandlers.add(fn)
  return () => snapshotHandlers.delete(fn)
}

function runSnapshotHandlers() {
  snapshotHandlers.forEach(fn => {
    try { fn() } catch { /* empty */ }
  })
}

export function expireSession(reason = 'expired') {
  try {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(REDIRECT_GUARD_KEY)) return
    sessionStorage.setItem(REDIRECT_GUARD_KEY, '1')
    try { sessionStorage.setItem(EXPIRED_REASON_KEY, reason) } catch { /* empty */ }

    runSnapshotHandlers()

    localStorage.removeItem('token')
    localStorage.removeItem('user')

    const target = '/login?session=expired'
    if (window.location.pathname !== '/login') {
      window.location.replace(target)
    } else if (!window.location.search.includes('session=expired')) {
      window.location.replace(target)
    }
  } catch { /* empty */ }
}

export function clearSessionRedirectFlag() {
  try {
    sessionStorage.removeItem(REDIRECT_GUARD_KEY)
  } catch { /* empty */ }
}

export function startSessionWatch() {
  if (typeof window === 'undefined' || watchStarted) return
  watchStarted = true

  if (localStorage.getItem('token') && !localStorage.getItem(LAST_ACTIVITY_KEY)) {
    touchActivity()
  }

  const onActivity = () => touchActivity()
  window.addEventListener('pointerdown', onActivity, { passive: true })
  window.addEventListener('keydown', onActivity)
  window.addEventListener('touchstart', onActivity, { passive: true })
  window.addEventListener('wheel', onActivity, { passive: true })

  window.addEventListener('storage', (e) => {
    if (e.key === 'token' && !e.newValue && window.location.pathname !== '/login') {
      expireSession('other-tab')
    }
  })

  window.setInterval(() => {
    try {
      if (!localStorage.getItem('token')) return
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0)
      if (!last) {
        touchActivity()
        return
      }
      if (Date.now() - last > INACTIVITY_LIMIT_MS) {
        expireSession('inactivity')
      }
    } catch { /* empty */ }
  }, 30000)
}
