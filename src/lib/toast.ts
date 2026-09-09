/**
 * Strict No-Toast / No-Popup Notification Shim
 * Ensures zero toast notifications or popups are rendered across the application.
 */
export const toast = {
  success: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
  info: (..._args: unknown[]) => {},
  warning: (..._args: unknown[]) => {},
  message: (..._args: unknown[]) => {},
  promise: (..._args: unknown[]) => {},
  loading: (..._args: unknown[]) => {},
  dismiss: (..._args: unknown[]) => {},
  custom: (..._args: unknown[]) => {},
};

export const Toaster = () => null;

export default toast;
