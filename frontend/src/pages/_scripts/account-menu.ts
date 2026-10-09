import { logout } from '@frontend/api/auth/logout';
import { reportError } from '@frontend/components/toast';
document.addEventListener('astro:page-load', () => {
  document.querySelectorAll<HTMLElement>('[data-account-menu]').forEach((root) => {
    const dropdown = root.querySelector<HTMLDetailsElement>('[data-account-dropdown]');
    const dialog = root.querySelector<HTMLDialogElement>('dialog');
    if (dropdown) {
      document.addEventListener('click', (event) => {
        if (!dropdown.contains(event.target as Node)) dropdown.open = false;
      });
      dropdown.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          dropdown.open = false;
          dropdown.querySelector('summary')?.focus();
        }
      });
    }
    root.querySelector('[data-open-account]')?.addEventListener('click', () => dialog?.showModal());
    root.querySelectorAll<HTMLButtonElement>('[data-account-logout]').forEach((button) =>
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          const scope = root.dataset.accountScope === 'admin' ? 'admin' : 'app';
          await logout(scope);
          window.setTimeout(() => location.assign('/'), 450);
        } catch (error) {
          reportError(error, 'Falha ao sair.');
          button.disabled = false;
        }
      }),
    );
  });
});
