/**
 * Yeni sürüm (service worker) devreye girince sayfayı bir kez yeniler; böylece güncelleme
 * ikinci açılışı beklemeden görünür. İlk kurulumda (önceden kontrol eden service worker yokken) yenilemez.
 * Her set ve öğün dokunuşta kaydedildiği için yenileme veri kaybettirmez.
 */
export function reloadOnUpdate(
  sw: ServiceWorkerContainer | undefined = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined,
  reload: () => void = () => window.location.reload(),
): void {
  if (!sw) return;
  const hadController = !!sw.controller;
  let done = false;
  sw.addEventListener('controllerchange', () => {
    if (!hadController || done) return;
    done = true;
    reload();
  });
}
