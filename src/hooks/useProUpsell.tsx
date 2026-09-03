import React, { useCallback, useState } from 'react';

import { ProUpsellModal } from '../components/ProUpsellModal';

/** Shows the Pro-feature upsell modal for a given message. */
export function useProUpsell() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const showProUpsell = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
  }, []);

  const modal = <ProUpsellModal visible={visible} message={message} onClose={() => setVisible(false)} />;

  return { showProUpsell, modal };
}
