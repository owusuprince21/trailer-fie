// lib/notify.ts
import React from 'react';
import toast from 'react-hot-toast';

type Variant = 'default' | 'success' | 'error' | 'loading';

export function notify(opts: {
  title: string;
  description?: string;
  variant?: Variant;
  duration?: number;
  id?: string;     // reuse this id to update/avoid stacking
  once?: boolean;  // if true, use a global singleton id
}) {
  const body = React.createElement(
    'div',
    null,
    React.createElement('div', { className: 'font-semibold' }, opts.title),
    opts.description
      ? React.createElement(
          'div',
          { className: 'text-sm opacity-80' },
          opts.description
        )
      : null
  );

  const fn =
    opts.variant === 'success'
      ? toast.success
      : opts.variant === 'error'
      ? toast.error
      : opts.variant === 'loading'
      ? toast.loading
      : toast;

  // use provided id, or a singleton when `once` is true
  const id = opts.id ?? (opts.once ? 'app-toast-singleton' : undefined);

  return fn(body, {
    id,
    duration: opts.duration ?? 3000,
  });
}
