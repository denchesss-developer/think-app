const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

const TESTS = [
  { path: '/',                label: 'Home page' },
  { path: '/blog',            label: 'Blog index' },
  { path: '/terms-of-service', label: 'Terms page' },
  { path: '/privacy-policy',   label: 'Privacy page' },
  { path: '/cookie-policy',    label: 'Cookie page' },
  { path: '/think/abc',        label: 'Think page invalid ID (expect 404)' },
]

let passed = 0
let failed = 0

for (const { path, label } of TESTS) {
  try {
    const url = `${BASE}${path}`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const isInvalidThink = path.startsWith('/think/') && path !== '/think/[id]'
    if (isInvalidThink && res.status === 404) {
      console.log(`  PASS  ${label} (404 come atteso)`)
      passed++
    } else if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    } else {
      console.log(`  PASS  ${label}`)
      passed++
    }
  } catch (err) {
    console.log(`  FAIL  ${label}: ${err.message}`)
    failed++
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
