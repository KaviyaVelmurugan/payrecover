'use client';

import { useEffect, useRef } from 'react';
import '@adyen/adyen-web/styles/adyen.css';

type Session = { id: string; sessionData: string };

export function AdyenCheckoutPanel({ session, clientKey, onCompleted, onError }: { session: Session; clientKey: string; onCompleted: () => void; onError: (message: string) => void }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let checkoutComponent: { unmount?: () => void } | undefined;
    void import('@adyen/adyen-web/auto').then(async ({ AdyenCheckout, Dropin }) => {
      if (!active || !container.current) return;
      const checkout = await AdyenCheckout({
        environment: 'test',
        clientKey,
        session,
        countryCode: 'IN',
        locale: 'en-IN',
        analytics: { enabled: false },
        onPaymentCompleted: onCompleted,
        onError: (error) => onError(error.message || 'The payment form reported an error.'),
      });
      if (!active || !container.current) return;
      checkoutComponent = new Dropin(checkout).mount(container.current);
    }).catch(() => onError('The secure payment form could not be loaded.'));
    return () => { active = false; checkoutComponent?.unmount?.(); };
  }, [clientKey, onCompleted, onError, session]);

  return <div ref={container} className="min-h-28" aria-label="Adyen secure checkout" />;
}
