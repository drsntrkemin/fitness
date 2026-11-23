// iPhone (Safari / ana ekran PWA) ile ilgili tarayıcı yetenekleri. Spec §6.4.

/** Uygulama ana ekrandan (bağımsız pencere) mı açıldı? */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
}

/** Tarayıcıdan verileri kendiliğinden silmemesini ister. Desteklenmiyorsa sessizce geçer. */
export async function requestPersist(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted?.())) {
      await navigator.storage.persist();
    }
  } catch {
    /* desteklenmiyor */
  }
}

/**
 * Dosyayı iOS paylaşım sayfasıyla paylaşır (kullanıcı "Dosyalara Kaydet" seçer).
 * Paylaşım yoksa dosyayı indirir. Kullanıcı paylaşımı iptal ederse 'cancelled'.
 */
export async function shareFile(name: string, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([text], name, { type: 'application/json' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // Paylaşım başarısız olduysa indirmeye düş.
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

/** Metni panoya kopyalar. Kullanıcı dokunuşuyla çağrılmalı (iOS kuralı). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}
