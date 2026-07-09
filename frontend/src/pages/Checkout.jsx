import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, User, AlertTriangle, Play, RefreshCw, Layers } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const PRODUCTS = [
  { id: 'prod_sub', name: 'Premium Monthly Subscription', price: 999.00, amountPaise: 99900, desc: 'Best for individual developers. Access basic features.' },
  { id: 'prod_dev', name: 'Developer Pro Pack', price: 2499.00, amountPaise: 249900, desc: 'Advanced features, team sharing, and higher rate limits.' },
  { id: 'prod_ent', name: 'Enterprise API Access', price: 7999.00, amountPaise: 799900, desc: 'Unlimited fraud audits, custom rules, and 24/7 priority support.' }
];

export default function Checkout() {
  const [customerIdentifier, setCustomerIdentifier] = useState('demo_customer_1');
  const [ipAddress, setIpAddress] = useState('192.168.1.45');
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [loading, setLoading] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [message, setMessage] = useState(null);

  // Load Razorpay Script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      setScriptError(false);
    };
    script.onerror = () => {
      setScriptLoaded(false);
      setScriptError(true);
      logMessage('Razorpay script failed to load. Ad-blocker or offline?', 'error');
    };
    document.body.appendChild(script);

    // Populate a random customer ID and IP on load
    randomizeCustomer();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const randomizeCustomer = () => {
    const ids = ['alex_crypto', 'sarah_dev', 'john_mcafee', 'hacker_zero', 'elon_fan', 'matrix_neo'];
    const randomId = ids[Math.floor(Math.random() * ids.length)] + '_' + Math.floor(Math.random() * 900 + 100);
    const randomIp = `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 254 + 1)}`;
    setCustomerIdentifier(randomId);
    setIpAddress(randomIp);
  };

  const logMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 8000);
  };

  // 1. Normal Checkout Flow
  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create local order (gets razorpayOrderId back)
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          customerIdentifier,
          ipAddress
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await res.json();
      logMessage(`Order created in DB. Razorpay Order ID: ${orderData.razorpayOrderId}`, 'info');

      // If mock order, bypass checkout script overlay
      if (orderData.razorpayOrderId.startsWith('order_mock_')) {
        logMessage('Mock mode detected. Simulating automatic payment success...', 'info');
        await triggerMockWebhook(orderData, selectedProduct.amountPaise);
        setLoading(false);
        return;
      }

      // If real Razorpay script is not loaded
      if (!window.Razorpay) {
        logMessage('Razorpay SDK not loaded. Simulating mock webhook payment instead...', 'warning');
        await triggerMockWebhook(orderData, selectedProduct.amountPaise);
        setLoading(false);
        return;
      }

      // Open Razorpay Standard Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', 
        amount: orderData.amount, 
        currency: 'INR',
        name: 'PayGuard Demo Portal',
        description: selectedProduct.name,
        order_id: orderData.razorpayOrderId,
        handler: function (response) {
          logMessage(`Payment Authorized! ID: ${response.razorpay_payment_id}. Waiting for webhook capture confirmation...`, 'success');
        },
        prefill: {
          name: customerIdentifier,
          email: `${customerIdentifier}@example.com`,
          contact: '9999999999'
        },
        theme: {
          color: '#5275ff'
        },
        modal: {
          ondismiss: function () {
            logMessage('Payment modal closed.', 'warning');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      logMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger webhook simulation for mock orders
  const triggerMockWebhook = async (order, amount) => {
    try {
      const mockPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_mock_' + Math.random().toString(36).substring(2, 10),
              amount: amount,
              currency: 'INR',
              status: 'captured',
              order_id: order.razorpayOrderId
            }
          }
        }
      };

      const res = await fetch(`${API_BASE_URL}/api/webhook/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'mock_signature' // bypass validation
        },
        body: JSON.stringify(mockPayload)
      });

      if (res.ok) {
        logMessage(`Webhook simulation processed. Check Dashboard for status.`, 'success');
      } else {
        const text = await res.text();
        throw new Error(text || 'Webhook simulation failed');
      }
    } catch (err) {
      logMessage(`Webhook simulation failed: ${err.message}`, 'error');
    }
  };

  // 2. Simulate Velocity Attack (4 rapid orders + webhook)
  const handleSimulateAttack = async () => {
    setLoading(true);
    logMessage('Simulating rapid multi-device velocity attack...', 'info');
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/simulate-attack?customerIdentifier=${customerIdentifier}`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Simulation failed on backend');
      }

      const orderData = await res.json();
      logMessage(`Attack simulated! Final order (${orderData.razorpayOrderId}) risk score: ${orderData.riskScore}. Check dashboard to see it flagged.`, 'success');
    } catch (err) {
      logMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Simulate Amount Tampering
  const handleSimulateAmountMismatch = async () => {
    setLoading(true);
    logMessage('Simulating client-side amount tampering...', 'info');
    try {
      // Step A: Create order normally
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          customerIdentifier,
          ipAddress
        })
      });

      if (!res.ok) throw new Error('Order creation failed');
      const orderData = await res.json();

      // Step B: Post webhook with lower/tampered price (e.g. 5000 paise instead of catalog)
      logMessage(`Order created (${orderData.razorpayOrderId}). Posting webhook with tampered amount...`, 'info');
      await triggerMockWebhook(orderData, 5000); // 5000 Paise = 50 INR
    } catch (err) {
      logMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Script error alerts */}
      {scriptError && (
        <div className="bg-red-950/60 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3 text-red-200">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-red-400">Razorpay Checkout SDK Error</h4>
            <p className="text-sm opacity-90">
              The Razorpay Checkout library failed to load. Check your internet connection or disable ad-blockers.
              <strong> PayGuard will automatically fall back to Webhook simulation mode</strong> so you can still test the demo.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-600/35 to-indigo-950/40 border border-brand-500/20 p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 bg-brand-500/15 border border-brand-500/30 text-brand-300 px-3 py-1 rounded-full text-xs font-semibold w-max mb-3">
              <Sparkles className="h-3 w-3" />
              <span>Payment Gateway Sandboxed</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-brand-300">
              Checkout & Risk Simulator
            </h1>
            <p className="mt-2 text-gray-300 max-w-xl text-sm leading-relaxed">
              Experience the checkout flow, modify customer parameters, and trigger real-time fraud rules to see the dashboard flag attempts.
            </p>
          </div>
          <button
            onClick={randomizeCustomer}
            className="flex items-center justify-center space-x-2 bg-dark-800 hover:bg-dark-700 border border-gray-700 hover:border-gray-600 px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
          >
            <RefreshCw className="h-4 w-4 text-brand-400" />
            <span>Randomize Identity</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Catalog */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Layers className="h-5 w-5 text-brand-400" />
            <span>Select Product Catalog Item</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                onClick={() => setSelectedProduct(prod)}
                className={`relative rounded-2xl p-5 border cursor-pointer transition-all ${
                  selectedProduct.id === prod.id
                    ? 'bg-brand-500/10 border-brand-500 shadow-[0_0_15px_rgba(82,117,255,0.15)]'
                    : 'bg-dark-800/50 border-gray-800 hover:border-gray-700'
                }`}
              >
                {selectedProduct.id === prod.id && (
                  <div className="absolute top-3 right-3 bg-brand-500 text-white rounded-full p-0.5">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                )}
                <h3 className="font-bold text-lg text-white mb-1">{prod.name}</h3>
                <p className="text-xs text-gray-400 mb-4 h-12 leading-relaxed">{prod.desc}</p>
                <div className="mt-auto">
                  <span className="text-2xl font-black text-brand-400">₹{prod.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 block mt-1">One-time payment</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="bg-dark-800/40 border border-gray-800/60 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Price</p>
              <p className="text-3xl font-black text-white">₹{selectedProduct.price.toLocaleString()}</p>
            </div>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full md:w-auto bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 transition-all"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Pay with Razorpay</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Identity Configuration & Simulation */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <User className="h-5 w-5 text-brand-400" />
            <span>Customer Details</span>
          </h2>

          <div className="bg-dark-800/60 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Customer Identifier (e.g. Email / User ID)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerIdentifier}
                  onChange={(e) => setCustomerIdentifier(e.target.value)}
                  className="w-full bg-dark-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Simulated IP Address
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="w-full bg-dark-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <h2 className="text-xl font-bold flex items-center space-x-2 pt-2">
            <Play className="h-5 w-5 text-brand-400" />
            <span>Fraud Simulations</span>
          </h2>

          <div className="bg-dark-800/60 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                <span>Velocity Attack Simulator</span>
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Fires 4 rapid order creations for this customer to trigger the velocity fraud rule (+40) and IP changes (+30), auto-flagging it on the admin dashboard.
              </p>
              <button
                onClick={handleSimulateAttack}
                disabled={loading}
                className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:border-yellow-500/50 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Simulate Velocity Attack</span>
              </button>
            </div>

            <hr className="border-gray-800" />

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                <span>Amount Tampering Simulator</span>
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Creates an order for ₹{selectedProduct.price} but triggers a webhook callback declaring a price of ₹50.00. Evaluates to a +50 risk score.
              </p>
              <button
                onClick={handleSimulateAmountMismatch}
                disabled={loading}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Simulate Amount Mismatch</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Status Message Toast */}
      {message && (
        <div className={`fixed bottom-5 right-5 z-50 rounded-2xl p-4 border max-w-sm shadow-2xl backdrop-blur-md animate-slideIn ${
          message.type === 'success' ? 'bg-green-950/80 border-green-500/50 text-green-200' :
          message.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-200' :
          message.type === 'warning' ? 'bg-yellow-950/80 border-yellow-500/50 text-yellow-200' :
          'bg-dark-800/90 border-gray-700 text-gray-200'
        }`}>
          <div className="flex items-start space-x-3">
            <Shield className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              message.type === 'success' ? 'text-green-400' :
              message.type === 'error' ? 'text-red-400' :
              message.type === 'warning' ? 'text-yellow-400' :
              'text-brand-400'
            }`} />
            <div className="text-xs font-medium leading-relaxed">{message.text}</div>
          </div>
        </div>
      )}
    </div>
  );
}
