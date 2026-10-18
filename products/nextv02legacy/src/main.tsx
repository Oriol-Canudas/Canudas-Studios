import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import RecipientViewerScreen from './components/RecipientViewerScreen.tsx'

// V01 public recipient link: /share/:chapterId/:token. Checked once here,
// before anything session/store-related loads, so an external recipient
// with no NEXT account and no cookie never touches that machinery.
const shareMatch = window.location.pathname.match(/^\/share\/([^/]+)\/([^/]+)/)

const rootElement = (
  <StrictMode>
    {shareMatch ? <RecipientViewerScreen chapterId={shareMatch[1]} token={shareMatch[2]} /> : <App />}
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(rootElement)
