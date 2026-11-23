import { useState } from 'react';
import type { Band } from '../domain/types';

const newId = () => (typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `b${Date.now()}${Math.random()}`);

/** Bant listesi: hafiften ağıra sıralı. Ekle, sil, yukarı/aşağı taşı. */
interface Props {
  bands: Band[];
  onChange: (b: Band[]) => void;
  /** Silmeden önce onay iste (kayıtlı verisi olan Ayarlar ekranında). */
  confirmDelete?: boolean;
}

export default function BandEditor({ bands, onChange, confirmDelete = false }: Props) {
  const [name, setName] = useState('');
  const add = () => {
    const n = name.trim();
    if (!n) return;
    onChange([...bands, { id: newId(), name: n }]);
    setName('');
  };
  const move = (i: number, d: -1 | 1) => {
    const next = [...bands];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="band-editor">
      {bands.length === 0 ? (
        <p className="muted">Henüz bant yok. Bantın yoksa boş bırakabilirsin.</p>
      ) : (
        <ol className="list">
          {bands.map((b, i) => (
            <li key={b.id} className="list-row">
              <span className="band-rank">{i + 1}</span>
              <span className="grow">{b.name}</span>
              <button type="button" className="icon-btn" aria-label={`${b.name} yukarı taşı`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="icon-btn" aria-label={`${b.name} aşağı taşı`} disabled={i === bands.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="icon-btn danger" aria-label={`${b.name} sil`} onClick={() => {
                if (confirmDelete && !window.confirm(`"${b.name}" bandı silinsin mi? Bu bantla çalışan hareketler bir kolay seviyeye iner.`)) return;
                onChange(bands.filter((x) => x.id !== b.id));
              }}>✕</button>
            </li>
          ))}
        </ol>
      )}
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <label className="field grow">
          <span>Bant adı</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. Kırmızı" autoComplete="off" />
        </label>
        <button type="submit" className="btn" disabled={!name.trim()}>Ekle</button>
      </form>
    </div>
  );
}
