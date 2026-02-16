import { RefObject, useEffect } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [contenteditable], [tabindex]:not([tabindex="-1"])';

function isElementVisible(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.tabIndex >= 0 &&
      isElementVisible(element)
  );
}

interface UseModalAccessibilityOptions {
  isOpen: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  autoFocusSelector?: string;
  disableBodyScroll?: boolean;
  restoreFocus?: boolean;
}

export function useModalAccessibility({
  isOpen,
  dialogRef,
  onClose,
  autoFocusSelector,
  disableBodyScroll = true,
  restoreFocus = true,
}: UseModalAccessibilityOptions) {
  useEffect(() => {
    if (!isOpen || !dialogRef.current || typeof document === 'undefined') {
      return;
    }

    const dialog = dialogRef.current;
    const previousActiveElement =
      restoreFocus && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousBodyOverflow =
      disableBodyScroll && typeof document !== 'undefined' ? document.body.style.overflow : null;

    if (disableBodyScroll) {
      document.body.style.overflow = 'hidden';
    }

    const focusables = getFocusableElements(dialog);

    const defaultFocusTarget = autoFocusSelector
      ? dialog.querySelector<HTMLElement>(autoFocusSelector)
      : null;
    if (defaultFocusTarget) {
      defaultFocusTarget.focus();
    } else if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      dialog.tabIndex = -1;
      dialog.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const currentFocusables = getFocusableElements(dialog);
      if (currentFocusables.length === 0) {
        return;
      }

      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];
      const current = document.activeElement as HTMLElement;
      if (!dialog.contains(current)) {
        first.focus();
        return;
      }

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);

      if (disableBodyScroll && previousBodyOverflow !== null) {
        document.body.style.overflow = previousBodyOverflow;
      }

      if (restoreFocus && previousActiveElement) {
        previousActiveElement.focus();
      }
    };
  }, [autoFocusSelector, dialogRef, disableBodyScroll, isOpen, onClose, restoreFocus]);
}
