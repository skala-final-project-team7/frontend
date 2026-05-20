/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend 공통 toast 상태 관리 composable.
 *           전역 toast 큐를 관리하며 메시지 노출/자동 dismiss를 제공한다.
 * 작성일 : 2026-05-20
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-20, feature8 보정, useToast 최초 작성
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x 기준
 * --------------------------------------------------
 */
import { readonly, ref } from 'vue';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

export type ShowToastOptions = {
  variant?: ToastVariant;
  duration?: number;
};

const toasts = ref<ToastItem[]>([]);
let nextToastId = 0;
const DEFAULT_TOAST_DURATION_MS = 2500;

function showToast(message: string, options: ShowToastOptions = {}) {
  const id = ++nextToastId;
  const variant = options.variant ?? 'success';
  const duration = options.duration ?? DEFAULT_TOAST_DURATION_MS;

  toasts.value = [...toasts.value, { id, message, variant }];

  if (duration > 0) {
    window.setTimeout(() => {
      toasts.value = toasts.value.filter((toast) => toast.id !== id);
    }, duration);
  }

  return id;
}

function dismissToast(id: number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    showToast,
    dismissToast,
  };
}
