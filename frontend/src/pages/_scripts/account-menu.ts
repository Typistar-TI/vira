import { logout } from '@frontend/api/auth/logout';
import { reportError } from '@frontend/components/toast';
document.querySelectorAll<HTMLElement>('[data-account-menu]').forEach((root) => {
  const dropdown = root.querySelector<HTMLDetailsElement>('[data-account-dropdown]')!;
  const dialog = root.querySelector<HTMLDialogElement>('[data-account-dialog]')!;
  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target as Node)) dropdown.open = false;
  });
  dropdown.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      dropdown.open = false;
      dropdown.querySelector('summary')?.focus();
    }
  });
  root.querySelector('[data-open-account]')?.addEventListener('click', () => dialog.showModal());
  root.querySelector('[data-close-account]')?.addEventListener('click', () => dialog.close());
  root.querySelectorAll<HTMLAnchorElement>('a').forEach((link) =>
    link.addEventListener('click', () => {
      dropdown.open = false;
      dialog.close();
    }),
  );
  root.querySelectorAll<HTMLButtonElement>('[data-account-logout]').forEach((button) =>
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await logout();
        window.setTimeout(() => location.assign('/'), 450);
      } catch (error) {
        reportError(error, 'Falha ao sair.');
        button.disabled = false;
      }
    }),
  );
});
