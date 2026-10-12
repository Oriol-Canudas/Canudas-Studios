import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Case3App from './case3/Case3App.tsx'

// Case 3 (Flight 702) is a structurally different CRISIS-grammar prototype,
// deliberately not wired through caseData.ts's case-switcher (that
// mechanism is shaped for the INVESTIGATION grammar's WitnessConfig/
// TestimonyTopic data, which Case 3 doesn't use at all). Path-gated so
// Case 002/Ascent are completely untouched.
const isCase3 = window.location.pathname.startsWith('/case3')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isCase3 ? <Case3App /> : <App />}
  </StrictMode>,
)
