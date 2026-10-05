/** Moves existing controls into a modal without duplicating forms or their listeners. */
export function previewStudio(id: string) {
  const dialog = document.getElementById(id) as HTMLDialogElement;
  const stage = dialog.querySelector<HTMLElement>('[data-studio-stage]')!;
  const panel = dialog.querySelector<HTMLElement>('[data-studio-controls]')!;
  let restore: (() => void) | undefined;
  let trigger: HTMLElement | null = null;
  const move = (element: HTMLElement, target: HTMLElement) => {
    const marker = document.createComment('studio-original-position');
    element.before(marker);
    target.append(element);
    return () => marker.replaceWith(element);
  };
  dialog.querySelector('[data-studio-close]')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-studio-toggle]')?.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });
  dialog.addEventListener('close', () => {
    restore?.();
    restore = undefined;
    trigger?.focus();
    document.documentElement.style.overflow = '';
  });
  return {
    open(preview: HTMLIFrameElement, controls: HTMLElement) {
      if (dialog.open) return;
      trigger = document.activeElement as HTMLElement;
      // Extract the frame first: for emails, it starts inside the controls form.
      const restorePreview = move(preview, stage);
      const restoreControls = move(controls, panel);
      restore = () => {
        restoreControls();
        restorePreview();
      };
      panel.hidden = false;
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    },
  };
}
