import React, { useCallback, useState } from 'react';

import { SuccessModal } from '../components/SuccessModal';

/** Brief animated confirmation shown right after something is saved —
 * the "added" counterpart to useDeleteConfirmation's post-delete modal. */
export function useSuccessAlert(defaultTitle = 'Saved') {
  const [visible, setVisible] = useState(false);
  const [copy, setCopy] = useState({ title: defaultTitle, message: '' });

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      setCopy({ title: title ?? defaultTitle, message });
      setVisible(true);
    },
    [defaultTitle]
  );

  const modal = (
    <SuccessModal visible={visible} title={copy.title} message={copy.message} onDone={() => setVisible(false)} />
  );

  return { showSuccess, modal };
}
