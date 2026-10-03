import React from 'react';
import { showSuccessToast, showErrorToast, showInfoToast } from '../Modal/confirmDialog';

export const ToastNotification = {
  success: (msg) => showSuccessToast(msg),
  error: (msg) => showErrorToast(msg),
  info: (msg) => showInfoToast(msg),
};

export default ToastNotification;
