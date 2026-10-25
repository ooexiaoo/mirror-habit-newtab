import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, ChevronDown, CornerDownLeft, Search } from 'lucide-react'
import { openSearch } from '../lib/search'
import { SEARCH_ENGINES, type SearchEngineId } from '../lib/settings'

interface SearchBarProps {
  engine: SearchEngineId
  customUrl: string
  onEngineChange: (engine: SearchEngineId) => void
}

const ENGINE_MARKS: Record<SearchEngineId, string> = {
  google: 'G',
  duckduckgo: 'D',
  brave: 'B',
  bing: 'b',
  ecosia: 'E',
  startpage: 'S',
  custom: '↗',
}

function EngineMark({ id }: { id: SearchEngineId }) {
  return (
    <span className="engine-mark" data-engine={id} aria-hidden="true">
      {ENGINE_MARKS[id]}
    </span>
  )
}

export function SearchBar({ engine, customUrl, onEngineChange }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const activeEngine = SEARCH_ENGINES.find((item) => item.id === engine) ?? SEARCH_ENGINES[0]
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.body.classList.contains('modal-open')) return
      const target = event.target
      const editing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
        return
      }

      if (!editing && !event.metaKey && !event.ctrlKey && !event.altKey && event.key === '/') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (
        pickerRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!query.trim()) {
      inputRef.current?.focus()
      return
    }
    openSearch(engine, customUrl, query)
  }

  return (
    <form
      className="search"
      role="search"
      onSubmit={submit}
      data-focused={focused}
      data-open={open}
    >
      <Search className="search__icon" size={21} strokeWidth={1.6} aria-hidden="true" />
      <input
        ref={inputRef}
        className="search__input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search the web, quietly"
        aria-label="Search the web"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
      />
      <span className="search__return" aria-hidden="true">
        <CornerDownLeft size={14} strokeWidth={1.8} />
      </span>
      <div className="search__engine">
        <button
          ref={triggerRef}
          type="button"
          className="engine-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Search engine: ${activeEngine.label}`}
          onClick={() => setOpen((value) => !value)}
        >
          <EngineMark id={engine} />
          <span className="engine-trigger__label">{activeEngine.label}</span>
          <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />
        </button>
        {open ? (
          <div
            ref={pickerRef}
            className="engine-menu"
            role="listbox"
            aria-label="Choose a search engine"
          >
            <p className="engine-menu__eyebrow">Search with</p>
            {SEARCH_ENGINES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={option.id === engine}
                className="engine-option"
                onClick={() => {
                  onEngineChange(option.id)
                  setOpen(false)
                  inputRef.current?.focus()
                }}
              >
                <EngineMark id={option.id} />
                <span>{option.label}</span>
                {option.id === engine ? (
                  <Check className="engine-option__check" size={15} strokeWidth={2} aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <span className="search__hint" aria-hidden="true">
        {isMac ? '⌘K' : 'Ctrl K'}
      </span>
    </form>
  )
}
