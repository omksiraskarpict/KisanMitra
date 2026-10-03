const crypto = require('crypto');
const Razorpay = require('razorpay');

const isPlaceholder = (value) => !value || /^(x+|your[_-]|replace[_-]|placeholder)/i.test(value) || /x{8,}/i.test(value);

const getRazorpayConfiguration = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId.startsWith('rzp_test_') || isPlaceholder(keyId) || isPlaceholder(keySecret)) return null;
  return { keyId, keySecret };
};

const createRazorpayClient = (configuration = getRazorpayConfiguration()) => {
  if (!configuration) return null;
  return new Razorpay({ key_id: configuration.keyId, key_secret: configuration.keySecret });
};

const verifyRazorpaySignature = (orderId, paymentId, signature, secret = process.env.RAZORPAY_KEY_SECRET) => {
  if (!orderId || !paymentId || !signature || !secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
};

module.exports = { getRazorpayConfiguration, createRazorpayClient, verifyRazorpaySignature };