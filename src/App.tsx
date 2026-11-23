import { useState } from 'react';

type Tab = 'today' | 'workout' | 'nutrition' | 'progress';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Bugün', icon: '☀︎' },
  { id: 'workout', label: 'Antrenman', icon: '🏋︎' },
  { id: 'nutrition', label: 'Beslenme', icon: '🍽︎' },
  { id: 'progress', label: 'İlerleme', icon: '📈︎' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const current = TABS.find((t) => t.id === tab)!;
  return (
    <div className="app">
      <main className="screen">
        <h1>{current.label}</h1>
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? 'tab active' : 'tab'}
            aria-current={t.id === tab ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon" aria-hidden="true">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
