import Swal from 'sweetalert2';

// Clean light-themed toast mixin
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
  customClass: {
    popup: 'cf-swal-modal',
  },
});

export const showSuccessToast = (message = 'Operation successful!') => {
  return Toast.fire({
    icon: 'success',
    title: message,
  });
};

export const showErrorToast = (message = 'An error occurred!') => {
  return Toast.fire({
    icon: 'error',
    title: message,
  });
};

export const showConfirmDialog = async ({
  title = 'Are you sure?',
  text = "You won't be able to revert this!",
  confirmButtonText = 'Yes, proceed',
  cancelButtonText = 'Cancel',
  icon = 'warning',
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#2563EB',
    cancelButtonColor: '#6B7280',
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    customClass: {
      popup: 'cf-swal-modal',
    },
  });

  return result.isConfirmed;
};

export const showDeleteConfirm = async (itemName = 'this item') => {
  return showConfirmDialog({
    title: `Delete ${itemName}?`,
    text: `This action will permanently delete ${itemName}. This cannot be undone.`,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'No, keep it',
    icon: 'warning',
  });
};
