import { reloadOnUpdate } from '../../src/platform/pwa';

function fakeContainer(controller: object | null) {
  const target = new EventTarget();
  return Object.assign(target, { controller }) as unknown as ServiceWorkerContainer;
}

test('yeni sürüm devreye girince sayfa bir kez yenilenir', () => {
  const reload = vi.fn();
  const sw = fakeContainer({});
  reloadOnUpdate(sw, reload);
  sw.dispatchEvent(new Event('controllerchange'));
  sw.dispatchEvent(new Event('controllerchange'));
  expect(reload).toHaveBeenCalledTimes(1);
});

test('ilk kurulumda (önceden service worker yokken) yenilenmez', () => {
  const reload = vi.fn();
  const sw = fakeContainer(null);
  reloadOnUpdate(sw, reload);
  sw.dispatchEvent(new Event('controllerchange'));
  expect(reload).not.toHaveBeenCalled();
});

test('service worker desteklenmiyorsa hiçbir şey yapmaz', () => {
  expect(() => reloadOnUpdate(undefined, vi.fn())).not.toThrow();
});
