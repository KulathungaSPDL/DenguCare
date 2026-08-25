import React, { useCallback, useRef, useState } from 'react';

import { ConfirmModal } from '../components/ConfirmModal';
import { SuccessModal } from '../components/SuccessModal';

interface Options {
  title?: string;
  message?: string;
  successMessage?: string;
}

/** Wraps any destructive action behind a "Yes / No" warning modal, then shows
 * a brief animated success confirmation once the action actually runs. */
export function useDeleteConfirmation() {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [copy, setCopy] = useState<Required<Options>>({
    title: 'Delete this entry?',
    message: "This will remove it from your record. This can't be undone.",
    successMessage: 'The entry has been removed.',
  });
  const pendingAction = useRef<(() => void) | null>(null);

  const confirmDelete = useCallback((onConfirm: () => void, options?: Options) => {
    setCopy((prev) => ({ ...prev, ...options }));
    pendingAction.current = onConfirm;
    setConfirmVisible(true);
  }, []);

  function handleConfirm() {
    pendingAction.current?.();
    pendingAction.current = null;
    setConfirmVisible(false);
    setSuccessVisible(true);
  }

  function handleCancel() {
    pendingAction.current = null;
    setConfirmVisible(false);
  }

  const modals = (
    <>
      <ConfirmModal
        visible={confirmVisible}
        title={copy.title}
        message={copy.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <SuccessModal
        visible={successVisible}
        message={copy.successMessage}
        onDone={() => setSuccessVisible(false)}
      />
    </>
  );

  return { confirmDelete, modals };
}
