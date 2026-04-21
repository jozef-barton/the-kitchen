import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppPage, Session } from '@hermes-recipes/protocol';

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  section: 'sessions' | 'navigation' | 'actions';
  action: () => void;
};

const NAV_LABELS: Record<AppPage, string> = {
  chat: 'Chat',
  recipes: 'Spaces',
  sessions: 'All Sessions',
  jobs: 'Jobs',
  tools: 'Tools',
  skills: 'Skills',
  settings: 'Settings'
};

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SessionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 3.5h8.5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H2.5A1.5 1.5 0 0 1 1 10V5a1.5 1.5 0 0 1 1-1.5Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 6.5h5M3 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function CommandPalette({
  recentSessions,
  onOpenSession,
  onOpenPage,
  onCreateSession,
  onClose
}: {
  recentSessions: Session[];
  onOpenSession: (sessionId: string) => void;
  onOpenPage: (page: AppPage) => void;
  onCreateSession: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems: CommandItem[] = [
    {
      id: 'action:new-session',
      label: 'New session',
      hint: '⌘N',
      section: 'actions',
      action: () => {
        onCreateSession();
        onClose();
      }
    },
    ...(['recipes', 'sessions', 'jobs', 'tools', 'skills', 'settings'] as AppPage[]).map((page) => ({
      id: `nav:${page}`,
      label: `Go to ${NAV_LABELS[page]}`,
      hint: page === 'recipes' ? '⌘R' : page === 'sessions' ? '⌘⇧S' : undefined,
      section: 'navigation' as const,
      action: () => {
        onOpenPage(page);
        onClose();
      }
    })),
    ...recentSessions.slice(0, 10).map((session) => ({
      id: `session:${session.id}`,
      label: session.title,
      section: 'sessions' as const,
      action: () => {
        onOpenSession(session.id);
        onClose();
      }
    }))
  ];

  const filteredItems = query.trim()
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const sections = Array.from(new Set(filteredItems.map((i) => i.section)));

  const flatItems = sections.flatMap((s) => filteredItems.filter((i) => i.section === s));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        flatItems[activeIndex]?.action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [flatItems, activeIndex, onClose]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sectionLabels: Record<string, string> = {
    actions: 'Actions',
    navigation: 'Navigation',
    sessions: 'Recent Sessions'
  };

  return (
    <div
      className="command-palette-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="command-palette" role="search">
        <div className="command-palette__input-row">
          <span className="command-palette__icon">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            className="command-palette__input"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search sessions, pages, actions…"
            aria-label="Search command palette"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="command-palette__results" role="listbox">
          {flatItems.length === 0 ? (
            <div className="command-palette__empty">No results for "{query}"</div>
          ) : (
            (() => {
              let globalIndex = 0;
              return sections.map((section) => {
                const items = filteredItems.filter((i) => i.section === section);
                if (items.length === 0) return null;
                return (
                  <div key={section}>
                    <div className="command-palette__section-label">{sectionLabels[section]}</div>
                    {items.map((item) => {
                      const idx = globalIndex++;
                      return (
                        <div
                          key={item.id}
                          className={`command-palette__item${activeIndex === idx ? ' command-palette__item--active' : ''}`}
                          role="option"
                          aria-selected={activeIndex === idx}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => item.action()}
                        >
                          <span className="command-palette__item-icon">
                            {item.section === 'sessions' ? <SessionIcon /> : <NavIcon />}
                          </span>
                          <span className="command-palette__item-label">{item.label}</span>
                          {item.hint ? (
                            <span className="command-palette__item-hint">{item.hint}</span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()
          )}
        </div>

        <div className="command-palette__footer">
          <span className="command-palette__kbd">
            <kbd>↑</kbd><kbd>↓</kbd> navigate
          </span>
          <span className="command-palette__kbd">
            <kbd>↵</kbd> open
          </span>
          <span className="command-palette__kbd">
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
