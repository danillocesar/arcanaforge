export type ToastVariant = 'default' | 'info' | 'sync' | 'attack';

export type ToastHandler = (
  text: string,
  variant: ToastVariant,
  pmCusto?: number,
) => void;

let toastHandler: ToastHandler | null = null;

export function setToastHandler(handler: ToastHandler | null): void {
  toastHandler = handler;
}

export function showToast(
  text: string,
  variant: ToastVariant = 'default',
  pmCusto?: number,
): void {
  toastHandler?.(text, variant, pmCusto);
}

