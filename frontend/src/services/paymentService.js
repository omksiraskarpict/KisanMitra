import api from '../api';

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve();
    return;
  }

  const existingScript = document.getElementById('razorpay-checkout-sdk');
  if (existingScript) {
    if (existingScript.dataset.loaded === 'true') {
      resolve();
      return;
    }
    existingScript.addEventListener('load', resolve, { once: true });
    existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay Checkout.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.id = 'razorpay-checkout-sdk';
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = () => {
    script.dataset.loaded = 'true';
    resolve();
  };
  script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'));
  document.body.appendChild(script);
});

const recordPaymentFailure = async (orderId, razorpayOrderId, failureReason) => {
  try {
    await api.post('/payments/failure', { orderId, razorpayOrderId, failureReason });
  } catch {
    // A later order-status request remains authoritative if the failure callback cannot be recorded.
  }
};

export const createRazorpayOrder = async (orderId) => {
  const { data } = await api.post('/payments/create-order', { orderId });
  return data;
};

export const verifyRazorpayPayment = async (paymentResponse) => {
  const { data } = await api.post('/payments/verify', paymentResponse);
  return data;
};

export const startRazorpayPayment = async (orderId) => {
  const paymentOrder = await createRazorpayOrder(orderId);

  try {
    await loadRazorpayCheckout();
  } catch (error) {
    await recordPaymentFailure(orderId, paymentOrder.razorpayOrderId, error.message);
    throw error;
  }

  return new Promise((resolve) => {
    let finished = false;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      resolve(result);
    };

    const checkout = new window.Razorpay({
      key: paymentOrder.keyId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      order_id: paymentOrder.razorpayOrderId,
      name: 'KisanMitra',
      description: `Order ${orderId}`,
      prefill: paymentOrder.farmer,
      theme: { color: '#1d7a3f' },
      handler: async (response) => {
        try {
          const verification = await verifyRazorpayPayment(response);
          finish({ status: 'SUCCESS', verification });
        } catch (error) {
          finish({ status: 'PENDING', error: error.response?.data?.message || 'Payment verification is pending.' });
        }
      },
      modal: {
        ondismiss: async () => {
          if (finished) return;
          await recordPaymentFailure(orderId, paymentOrder.razorpayOrderId, 'Checkout was closed before payment completed.');
          finish({ status: 'FAILED' });
        }
      }
    });

    checkout.on('payment.failed', async (event) => {
      if (finished) return;
      const description = event.error?.description || event.error?.reason || 'Payment was not completed.';
      await recordPaymentFailure(orderId, paymentOrder.razorpayOrderId, description);
      finish({ status: 'FAILED', error: description });
    });

    checkout.open();
  });
};