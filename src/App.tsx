import { useCallback, useEffect, useState } from 'react';
import TabBar, { type Tab } from './components/TabBar';
import { getSettings } from './data/repo';
import type { Settings } from './domain/types';
import { requestPersist } from './platform/ios';
import SettingsScreen from './screens/Settings';
import Setup from './screens/Setup';

const TITLES: Record<Tab, string> = { today: 'Bugün', workout: 'Antrenman', nutrition: 'Beslenme', progress: 'İlerleme' };

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [showSettings, setShowSettings] = useState(false);

  const reload = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
    if (!s.setupDone) setShowSettings(false);
  }, []);

  useEffect(() => {
    reload();
    requestPersist();
  }, [reload]);

  if (!settings) return <div className="app" aria-busy="true" />;
  if (!settings.setupDone) return <Setup onDone={reload} />;
  if (showSettings) return <SettingsScreen settings={settings} onChange={reload} onClose={() => setShowSettings(false)} />;

  return (
    <div className="app">
      <main className="screen">
        <header className="screen-header">
          <h1>{TITLES[tab]}</h1>
          {tab === 'today' && (
            <button type="button" className="icon-btn" aria-label="Ayarlar" onClick={() => setShowSettings(true)}>⚙</button>
          )}
        </header>
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
}
