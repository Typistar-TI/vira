import { showToast } from '@frontend/components/toast';
import {
  getPushKey,
  getPushPreferences,
  setPushPreferences,
  subscribePush,
  unsubscribePush,
} from '@frontend/api/push/push';

function supported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

export async function hasPushSubscription(): Promise<boolean> {
  if (!supported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(await registration.pushManager.getSubscription());
  } catch {
    return false;
  }
}

export async function enablePush(): Promise<boolean> {
  if (!supported()) return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  const { publicKey } = await getPushKey();
  if (!publicKey) return false;
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription)
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToBytes(publicKey),
    });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
  await subscribePush({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
  return true;
}

export async function disablePush(): Promise<void> {
  if (!supported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  try {
    await unsubscribePush(subscription.endpoint);
  } catch {
    /* keep going: the browser subscription is removed below */
  }
  await subscription.unsubscribe();
}

function labels() {
  const en = document.documentElement.lang === 'en';
  return {
    title: en ? 'Turn on notifications' : 'Ativar notificações',
    text: en
      ? 'Get alerts about your account, plan and page performance.'
      : 'Receba avisos da sua conta, do plano e do desempenho da página.',
    enable: en ? 'Enable' : 'Ativar',
    later: en ? 'Not now' : 'Agora não',
    enabled: en ? 'Notifications enabled.' : 'Notificações ativadas.',
    failed: en ? 'Could not enable notifications.' : 'Não foi possível ativar as notificações.',
  };
}

/** Small banner asking for notification permission when the app opens. */
export function initPushPrompt(): void {
  if (!supported()) return;
  if (Notification.permission === 'granted') {
    void ensureSubscription();
    return;
  }
  if (Notification.permission !== 'default') return;
  if (sessionStorage.getItem('vira-push-dismissed') === '1') return;
  const text = labels();
  const banner = document.createElement('div');
  banner.setAttribute('data-push-banner', '');
  banner.className =
    'fixed inset-x-3 bottom-3 z-[90] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-[#d8ae73] bg-white p-4 text-left shadow-[0_18px_45px_-18px_rgba(32,23,10,0.32)] sm:inset-x-auto sm:right-5';
  banner.innerHTML = `
    <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f6e6c8] text-[#b88333]" aria-hidden="true">
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/></svg>
    </span>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-[#17130d]">${text.title}</p>
      <p class="mt-0.5 text-xs text-[#625a51]">${text.text}</p>
      <div class="mt-3 flex items-center gap-2">
        <button type="button" data-push-enable class="btn btn-primary btn-sm rounded-full">${text.enable}</button>
        <button type="button" data-push-dismiss class="btn btn-ghost btn-sm rounded-full">${text.later}</button>
      </div>
    </div>`;
  document.body.append(banner);
  banner.querySelector('[data-push-enable]')?.addEventListener('click', async () => {
    try {
      const enabled = await enablePush();
      banner.remove();
      if (enabled) showToast(text.enabled, 'success');
    } catch {
      banner.remove();
      showToast(text.failed, 'error');
    }
  });
  banner.querySelector('[data-push-dismiss]')?.addEventListener('click', () => {
    sessionStorage.setItem('vira-push-dismissed', '1');
    banner.remove();
  });
}

async function ensureSubscription(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    if (await registration.pushManager.getSubscription()) return;
    await enablePush();
  } catch {
    /* ignore */
  }
}

/** Wires the notification settings block on the account page. */
export function initPushSettings(root: HTMLElement): void {
  const en = document.documentElement.lang === 'en';
  const status = root.querySelector<HTMLElement>('[data-push-status]');
  const enable = root.querySelector<HTMLButtonElement>('[data-push-enable]');
  const disable = root.querySelector<HTMLButtonElement>('[data-push-disable]');
  const prefs = root.querySelector<HTMLElement>('[data-push-prefs]');
  const metricBox = root.querySelector<HTMLInputElement>('input[name="push-metrics"]');
  const billingBox = root.querySelector<HTMLInputElement>('input[name="push-billing"]');
  const setState = (subscribed: boolean) => {
    if (status)
      status.textContent = !supported()
        ? en
          ? 'This browser does not support notifications.'
          : 'Este navegador não oferece notificações.'
        : Notification.permission === 'denied'
          ? en
            ? 'Notifications are blocked in your browser settings.'
            : 'As notificações estão bloqueadas nas configurações do navegador.'
          : subscribed
            ? en
              ? 'On for this device.'
              : 'Ativadas neste dispositivo.'
            : en
              ? 'Off for this device.'
              : 'Desativadas neste dispositivo.';
    if (enable) enable.hidden = !supported() || subscribed || Notification.permission === 'denied';
    if (disable) disable.hidden = !subscribed;
    if (prefs) prefs.hidden = !subscribed;
  };
  const refresh = async () => {
    setState(await hasPushSubscription());
    if (supported()) {
      try {
        const values = await getPushPreferences();
        if (metricBox) metricBox.checked = values.metrics;
        if (billingBox) billingBox.checked = values.billing;
      } catch {
        /* keep defaults */
      }
    }
  };
  enable?.addEventListener('click', async () => {
    try {
      const enabled = await enablePush();
      if (!enabled) showToast(en ? 'Permission not granted.' : 'Permissão não concedida.', 'error');
    } catch {
      showToast(en ? 'Could not enable.' : 'Falha ao ativar.', 'error');
    }
    await refresh();
  });
  disable?.addEventListener('click', async () => {
    try {
      await disablePush();
    } catch {
      /* ignore */
    }
    await refresh();
  });
  const savePreferences = async () => {
    try {
      await setPushPreferences({
        metrics: metricBox?.checked ?? true,
        billing: billingBox?.checked ?? true,
      });
      showToast(en ? 'Preferences saved.' : 'Preferências salvas.', 'success');
    } catch {
      showToast(en ? 'Could not save.' : 'Falha ao salvar.', 'error');
    }
  };
  metricBox?.addEventListener('change', savePreferences);
  billingBox?.addEventListener('change', savePreferences);
  void refresh();
}
