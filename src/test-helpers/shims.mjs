import React from 'react';

export function Link({ href, children, ...props }) {
  return React.createElement('a', { href: typeof href === 'string' ? href : href?.pathname || '#', ...props }, children);
}
export default Link;

export function Image({ src, alt, ...props }) {
  return React.createElement('img', { src, alt, ...props });
}

export const toast = {
  success: (msg) => msg,
  error: (msg) => msg,
  info: (msg) => msg,
  warning: (msg) => msg,
};

export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
  };
}

export function usePathname() {
  return '/';
}

export function useSearchParams() {
  return new URLSearchParams();
}
