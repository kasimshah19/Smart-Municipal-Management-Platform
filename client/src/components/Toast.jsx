import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hideToast } from '../store/uiSlice.js';

function Toast() {
  const toast = useSelector((state) => state.ui.toast);
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!toast) return;

    setLeaving(false);
    setVisible(true);

    // Clear any previous dismiss timer
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setLeaving(true);
      // Wait for fade-out animation to finish before unmounting
      setTimeout(() => {
        setVisible(false);
        setLeaving(false);
        dispatch(hideToast());
      }, 300);
    }, 3000);

    return () => clearTimeout(timerRef.current);
  }, [toast, dispatch]);

  if (!visible || !toast) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-5 py-3 text-[14px] font-medium text-white"
      style={{
        backgroundColor: 'var(--navy)',
        borderRadius: '10px',
        animation: leaving
          ? 'toast-out 0.3s ease forwards'
          : 'toast-in 0.3s ease forwards',
      }}
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
}

export default Toast;
