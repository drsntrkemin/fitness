export type Tab = 'today' | 'workout' | 'nutrition' | 'progress';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Bugün', icon: '☀︎' },
  { id: 'workout', label: 'Antrenman', icon: '🏋︎' },
  { id: 'nutrition', label: 'Beslenme', icon: '🍽︎' },
  { id: 'progress', label: 'İlerleme', icon: '📈︎' },
];

export default function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={t.id === tab ? 'tab active' : 'tab'}
          aria-current={t.id === tab ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <span className="tab-icon" aria-hidden="true">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
