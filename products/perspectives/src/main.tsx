import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Case3App from './case3/Case3App.tsx'
import Case3V2App from './case3v2/Case3V2App.tsx'

// Case 3 (Flight 702) is a structurally different CRISIS-grammar prototype,
// deliberately not wired through caseData.ts's case-switcher (that
// mechanism is shaped for the INVESTIGATION grammar's WitnessConfig/
// TestimonyTopic data, which Case 3 doesn't use at all). Path-gated so
// Case 002/Ascent are completely untouched.
//
// Flight 702 v2 is a SEPARATE, further-isolated EXPERIMENTAL prototype
// (/case3v2) testing one mechanism (bounded AI negotiation) — it shares
// no store/types with /case3 and must be checked BEFORE it, since
// "/case3v2" also starts with "/case3".
const pathname = window.location.pathname
const isCase3V2 = pathname.startsWith('/case3v2')
const isCase3 = !isCase3V2 && pathname.startsWith('/case3')

if (isCase3V2 || isCase3) {
  document.title = 'Flight702'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isCase3V2 ? <Case3V2App /> : isCase3 ? <Case3App /> : <App />}
  </StrictMode>,
)
