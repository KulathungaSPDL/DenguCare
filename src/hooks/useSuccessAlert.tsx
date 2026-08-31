import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SuccessModal } from '../components/SuccessModal';

/** Brief animated confirmation shown right after something is saved —
 * the "added" counterpart to useDeleteConfirmation's post-delete modal. */
export function useSuccessAlert(defaultTitle?: string) {
  const { t } = useTranslation();
  const resolvedDefaultTitle = defaultTitle ?? t('common.saved');
  const [visible, setVisible] = useState(false);
  const [copy, setCopy] = useState({ title: resolvedDefaultTitle, message: '' });

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      setCopy({ title: title ?? resolvedDefaultTitle, message });
      setVisible(true);
    },
    [resolvedDefaultTitle]
  );

  const modal = (
    <SuccessModal visible={visible} title={copy.title} message={copy.message} onDone={() => setVisible(false)} />
  );

  return { showSuccess, modal };
}
