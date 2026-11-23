import { useCallback, useEffect, useState } from 'react';
import TabBar, { type Tab } from './components/TabBar';
import { getSettings } from './data/repo';
import type { Settings } from './domain/types';
import { requestPersist } from './platform/ios';
import Nutrition from './screens/Nutrition';
import Progress from './screens/Progress';
import SettingsScreen from './screens/Settings';
import Setup from './screens/Setup';
import Today from './screens/Today';
import Workout from './screens/Workout';

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [autoStart, setAutoStart] = useState(false);
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

  const go = (t: Tab, start = false) => {
    setAutoStart(start);
    setTab(t);
    window.scrollTo?.(0, 0);
  };

  if (!settings) return <div className="app" aria-busy="true" />;
  if (!settings.setupDone) return <Setup onDone={reload} />;
  if (showSettings) return <SettingsScreen settings={settings} onChange={reload} onClose={() => setShowSettings(false)} />;

  return (
    <div className="app">
      {tab === 'today' && (
        <Today settings={settings} onOpenSettings={() => setShowSettings(true)}
          onStartWorkout={() => go('workout', true)} onContinueWorkout={() => go('workout')} />
      )}
      {tab === 'workout' && <Workout settings={settings} autoStart={autoStart} />}
      {tab === 'nutrition' && <Nutrition settings={settings} />}
      {tab === 'progress' && <Progress settings={settings} />}
      <TabBar tab={tab} onChange={(t) => go(t)} />
    </div>
  );
}
