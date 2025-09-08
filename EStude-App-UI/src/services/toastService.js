// Biến private lưu hàm showToast thật từ ToastProvider
let _showToast;

// Hàm này được ToastProvider gọi khi mount
export const setShowToast = (fn) => {
  _showToast = fn;
};

// Hàm này bạn dùng ở mọi nơi (service, util, API...) để show toast
export const showToast = (messageOrOpts, opts) => {
  if (_showToast) {
    _showToast(messageOrOpts, opts);
  } else {
    console.warn("ToastProvider chưa được mount, không thể show toast");
  }
};
