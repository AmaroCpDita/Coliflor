import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** World modals must escape the scene's isolated stacking context and touch lock. */
export default function WorldModalPortal({ children }: { children: ReactNode }) {
  return typeof document === 'undefined' ? children : createPortal(children, document.body);
}
