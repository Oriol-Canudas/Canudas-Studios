import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// A single, consistent "phone card" shell around the whole app. Every
// screen was built assuming a ~mobile-width viewport (several components
// independently cap their own content at max-w-md — CaseHome,
// ConfrontationScene, TabBar) while others render full-bleed — on an
// actual phone both look identical (full width either way), but on a
// wide desktop browser that mismatch becomes visible: some blocks
// left-aligned/edge-to-edge, others centered in a narrow column, exactly
// the misalignment reported in playtest. Capping and centering the WHOLE
// app here, once, fixes every screen at once instead of patching each
// one's own width treatment again. `transform` on this wrapper also
// gives `position: fixed` elements (TabBar, SoundToggle, TimeClock,
// BreakthroughToast, every modal/sheet) a containing block scoped to
// this card instead of the real browser viewport, so they stay anchored
// to the card's edges rather than the far edges of a wide window.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="mx-auto h-full max-w-md bg-[#0a0a0d]" style={{ transform: "translateZ(0)" }}>
      <App />
    </div>
  </StrictMode>,
)
