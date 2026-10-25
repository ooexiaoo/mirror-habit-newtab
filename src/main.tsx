import { createRoot } from 'react-dom/client'
import { NewTab } from './NewTab'
import { DEFAULT_SETTINGS, loadSettings } from './lib/settings'
import './styles.css'

async function boot() {
  const settings = await loadSettings().catch(() => DEFAULT_SETTINGS)
  const rootElement = document.getElementById('root')
  if (!rootElement) return
  createRoot(rootElement).render(<NewTab initialSettings={settings} />)
}

void boot()
