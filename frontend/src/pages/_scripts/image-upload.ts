import { reportError } from '@frontend/components/toast';

/** Liga cada área de envio de imagem: clique, teclado e arrastar/soltar. */
export function initImageUploads(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>('[data-image-upload]').forEach((root) => {
    if (root.dataset.imageUploadReady === '1') return;
    const input = root.querySelector<HTMLInputElement>('[data-image-upload-input]');
    if (!input) return;
    root.dataset.imageUploadReady = '1';

    const text = root.querySelector<HTMLElement>('[data-image-upload-text]');
    const preview = root.querySelector<HTMLImageElement>('[data-image-upload-preview]');
    const baseLabel = root.dataset.label || '';
    let objectUrl = '';

    const refresh = () => {
      const file = input.files?.[0];
      if (text) text.textContent = file ? file.name : baseLabel;
      root.classList.toggle('border-dashed', !file);
      root.classList.toggle('border-solid', Boolean(file));
      root.classList.toggle('border-[#b88333]', Boolean(file));
      if (!preview) return;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = '';
      }
      if (file) {
        objectUrl = URL.createObjectURL(file);
        preview.src = objectUrl;
        preview.classList.remove('hidden');
      } else if (!preview.dataset.imageUploadInitial) {
        preview.removeAttribute('src');
        preview.classList.add('hidden');
      }
    };

    if (preview?.getAttribute('src')) preview.dataset.imageUploadInitial = '1';

    const open = () => input.click();
    root.addEventListener('click', (event) => {
      if (event.target === input) return;
      open();
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
    input.addEventListener('change', refresh);

    let depth = 0;
    const highlight = (on: boolean) => root.classList.toggle('bg-[#fff4df]', on);
    root.addEventListener('dragenter', (event) => {
      event.preventDefault();
      depth += 1;
      highlight(true);
    });
    root.addEventListener('dragover', (event) => event.preventDefault());
    root.addEventListener('dragleave', () => {
      depth = Math.max(0, depth - 1);
      if (!depth) highlight(false);
    });
    root.addEventListener('drop', (event) => {
      event.preventDefault();
      depth = 0;
      highlight(false);
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        reportError(new Error('Envie um arquivo de imagem.'), 'Falha ao carregar a imagem');
        return;
      }
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      refresh();
    });

    refresh();
  });
}
