import { reportError } from '@frontend/components/toast';

const MAX_LENGTH = 200_000;

function resizeImage(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler a imagem'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Imagem inválida'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Canvas indisponível'));
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function initAvatarPicker(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>('[data-avatar-input]');
  const preview = root.querySelector<HTMLImageElement>('[data-avatar-preview]');
  const placeholder = root.querySelector<HTMLElement>('[data-avatar-placeholder]');
  const value = root.querySelector<HTMLInputElement>('[data-avatar-value]');
  const remove = root.querySelector<HTMLButtonElement>('[data-avatar-remove]');
  const show = (dataUrl: string) => {
    if (value) value.value = dataUrl;
    if (preview) {
      preview.src = dataUrl;
      preview.classList.toggle('hidden', !dataUrl);
    }
    if (placeholder) placeholder.classList.toggle('hidden', Boolean(dataUrl));
  };
  input?.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      if (dataUrl.length > MAX_LENGTH) throw new Error('Imagem muito grande');
      show(dataUrl);
    } catch (error) {
      reportError(error, 'Falha ao carregar a foto');
    }
    input.value = '';
  });
  remove?.addEventListener('click', () => show(''));
}

export function applyAvatarToMenu(dataUrl: string, initials: string) {
  document.querySelectorAll<HTMLImageElement>('[data-account-avatar]').forEach((image) => {
    image.src = dataUrl;
    image.classList.toggle('hidden', !dataUrl);
  });
  document.querySelectorAll<HTMLElement>('[data-account-initials]').forEach((node) => {
    node.textContent = initials;
    node.classList.toggle('hidden', Boolean(dataUrl));
  });
}
