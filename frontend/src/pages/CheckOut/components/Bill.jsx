import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore, useOrderStore } from '../../../store/store';
import { formatPrice } from '../../../data/productData';
import { useAuth, useUser } from "@clerk/clerk-react";
import api from '../../../utils/api';
import { useEffect } from 'react';

// Helper to dynamically load the Razorpay Checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};


const Bill = () => {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { placeOrder } = useOrderStore();
  const { getToken } = useAuth();
  const { user } = useUser();

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    country: 'India',
    streetAddress: '',
    townCity: '',
    province: '',
    zipCode: '',
    email: '',
  });

  const [saveDetails, setSaveDetails] = useState(false);

  // Pre-fill user data when Clerk loads or from database profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await getToken();
        if (token) {
          const profileRes = await api("/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (profileRes && profileRes.success && profileRes.user) {
            const addr = profileRes.user.defaultAddress || {};
            if (addr.streetAddress || addr.townCity || addr.phone) {
              setForm({
                firstName: addr.firstName || "",
                lastName: addr.lastName || "",
                phone: addr.phone || "",
                companyName: addr.companyName || "",
                country: addr.country || "India",
                streetAddress: addr.streetAddress || "",
                townCity: addr.townCity || "",
                province: addr.province || "",
                zipCode: addr.zipCode || "",
                email: addr.email || "",
              });
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load user address profile:", err);
      }

      if (user) {
        setForm((prev) => ({
          ...prev,
          firstName: prev.firstName || user.firstName || "",
          lastName: prev.lastName || user.lastName || "",
          email: prev.email || user.primaryEmailAddress?.emailAddress || "",
          phone: prev.phone || user.primaryPhoneNumber?.phoneNumber || "",
        }));
      }
    };

    loadProfile();
  }, [user, getToken]);

  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[0-9]{8,15}$/.test(form.phone.trim())) {
      newErrors.phone = "Invalid phone number";
    }
    if (!form.streetAddress.trim()) newErrors.streetAddress = "Address is required";
    if (!form.townCity.trim()) newErrors.townCity = "Town/City is required";
    if (!form.zipCode.trim()) {
      newErrors.zipCode = "Zipcode is required";
    } else if (!/^[0-9]{5,6}$/.test(form.zipCode.trim())) {
      newErrors.zipCode = "Zipcode must be 5 or 6 digits";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      showToast("Your cart is empty!");
      return;
    }

    if (!validateForm()) {
      showToast("Please fill in all required shipping details.");
      return;
    }

    // Save shipping details to profile if checkbox is checked
    if (saveDetails) {
      try {
        const token = await getToken();
        await api("/api/users/profile", {
          method: "PUT",
          body: { defaultAddress: form },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        console.log("✅ Saved shipping details to user profile");
      } catch (err) {
        console.warn("Failed to save shipping details to profile:", err);
      }
    }

    // Load Razorpay Checkout SDK script
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      showToast("Failed to connect to the payment gateway. Please check your network.");
      return;
    }

    try {
      const token = await getToken();

      const orderPayload = {
        items: items.map(item => ({
          productId: item._id,
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        shippingAddress: form
      };

      // 1. Contact backend to create Razorpay payment order
      const response = await api("/api/orders/create", {
        method: "POST",
        body: orderPayload,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!response.success) {
        showToast(response.message || "Failed to initiate payment");
        return;
      }

      const { order_id, key_id, amount, currency } = response;

      // 2. Open Razorpay payment gateway popup
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "Furniro",
        description: "Premium Furniture Checkout",
        order_id: order_id,
        handler: async function (paymentResponse) {
          try {
            showToast("Verifying payment...");
            
            const verifyPayload = {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            };

            // 3. Confirm checkout signature verification via backend
            const verificationResult = await api("/api/orders/verify", {
              method: "POST",
              body: verifyPayload,
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (verificationResult.success) {
              clearCart();

              const finalOrder = {
                id: verificationResult.order.razorpayOrderId || paymentResponse.razorpay_order_id,
                date: new Date(verificationResult.order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                status: "Paid",
                items: verificationResult.order.items,
                total: verificationResult.order.totalAmount,
                shippingDetails: verificationResult.order.shippingAddress
              };

              // Local storage backup
              placeOrder(finalOrder);

              // Direct user to payment-result page
              navigate('/payment-result', { state: { status: 'success', order: finalOrder } });
            } else {
              navigate('/payment-result', { state: { status: 'failed', errorMessage: "Payment signature verification failed." } });
            }
          } catch (verifyErr) {
            console.error("Payment signature verification failed:", verifyErr);
            navigate('/payment-result', { state: { status: 'pending', errorMessage: "Verification error. Payment status is pending." } });
          }
        },
        prefill: {
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          contact: form.phone
        },
        theme: {
          color: "#B88E2F"
        },
        modal: {
          ondismiss: async function () {
            console.log("Checkout modal closed by user");
            try {
              const token = await getToken();
              await api(`/api/orders/fail`, {
                method: "POST",
                body: {
                  razorpay_order_id: order_id,
                  error_description: "Payment modal closed by user"
                },
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
            } catch (err) {
              console.error("Failed to mark order as failed:", err);
            }
            navigate('/payment-result', { state: { status: 'failed', errorMessage: "Payment was cancelled by the user." } });
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on('payment.failed', async function (resp) {
        console.error("Razorpay transaction failed:", resp.error);
        try {
          const token = await getToken();
          await api(`/api/orders/fail`, {
            method: "POST",
            body: {
              razorpay_order_id: order_id,
              error_description: resp.error.description || "The transaction was declined by the bank."
            },
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        } catch (err) {
          console.error("Failed to mark order as failed:", err);
        }
        navigate('/payment-result', { state: { status: 'failed', errorMessage: resp.error.description || "The transaction was declined by the bank." } });
      });

      razorpayInstance.open();

    } catch (error) {
      console.error("Razorpay workflow error:", error);
      showToast(error.message || "An error occurred during payment processing");
    }
  };


  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-150">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Checkout</h2>
          <p className="text-gray-500 mb-6">You don't have any products in your cart to checkout.</p>
          <Link
            to="/shop"
            className="inline-block bg-[#B88E2F] text-white px-8 py-3 rounded font-semibold hover:bg-[#a5761f] transition"
          >
            Go to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-85 text-white text-sm px-6 py-2 rounded-full z-50 transition-all shadow-lg">
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        
        {/* Left Panel - Shipping Details Form */}
        <div className="left-panel flex-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Shipping Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="form-element">
              <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleInputChange}
                className={`border p-2.5 rounded w-full focus:outline-none focus:ring-1 ${
                  errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-400'
                }`}
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            
            <div className="form-element">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleInputChange}
                className={`border p-2.5 rounded w-full focus:outline-none focus:ring-1 ${
                  errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-400'
                }`}
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div className="form-element mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              placeholder="+62..."
              value={form.phone}
              onChange={handleInputChange}
              className={`border p-2.5 rounded w-full focus:outline-none focus:ring-1 ${
                errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-400'
              }`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div className="form-element mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name (Optional)</label>
            <input
              type="text"
              name="companyName"
              value={form.companyName}
              onChange={handleInputChange}
              className="border border-gray-300 p-2.5 rounded w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div className="form-element mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Country / Region *</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleInputChange}
              className="border border-gray-300 p-2.5 rounded w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div className="form-element mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Street Address *</label>
            <input
              type="text"
              name="streetAddress"
              placeholder="House number and street name"
              value={form.streetAddress}
              onChange={handleInputChange}
              className={`border p-2.5 rounded w-full focus:outline-none focus:ring-1 ${
                errors.streetAddress ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-400'
              }`}
            />
            {errors.streetAddress && <p className="text-red-500 text-xs mt-1">{errors.streetAddress}</p>}
          </div>

          <div className="form-element mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Town / City *</label>
            <input
              type="text"
              name="townCity"
              value={form.townCity}
              onChange={handleInputChange}
              className={`border p-2.5 rounded w-full focus:outline-none focus:ring-1 ${
                errors.townCity ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-400'
              }`}
            />
            {errors.townCity && <p className="text-red-500 text-xs mt-1">{errors.townCity}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="form-element">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Province / State (Optional)</label>
              <input
                type="text"
                name="province"
                placeholder="e.g. Bali"
                value={form.province}
                onChange={handleInputChange}
                className="border border-gray-300 p-2.5 rounded w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            
            <div className="form-element">
              <label className="block text-sm font-semibold text-gray-700 mb-1">ZIP Code *</label>
              <input
                type="text"
                name="zipCode"
                value={form.zipCode}
                onChange={handleInputChange}
                className={`border p-2.5 rounded w-full focus:outline-none focus:ring-1 ${
                  errors.zipCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-400'
                }`}
              />
              {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
            </div>
          </div>

          <div className="form-element mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleInputChange}
              className={`border p-2.5 rounded w-full focus:outline-none focus:ring-1 ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-400'
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="form-element mt-6 border-t border-gray-100 pt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={saveDetails}
                onChange={(e) => setSaveDetails(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[#B88E2F] focus:ring-[#B88E2F] cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-black transition">
                Save shipping and address details to profile
              </span>
            </label>
          </div>
        </div>

        {/* Right Panel - Checkout Summary */}
        <div className="right-panel w-full lg:w-[40%] bg-[#faf3ea] rounded-xl p-6 md:p-8 flex flex-col gap-6 h-fit border border-gray-250/50">
          <div className="flex justify-between items-center pb-4 border-b border-gray-300">
            <h4 className="text-xl font-bold text-gray-800">Product</h4>
            <h4 className="text-xl font-bold text-gray-800">Subtotal</h4>
          </div>

          {/* List of items */}
          <div className="space-y-4 mb-6 max-h-[240px] overflow-y-auto pr-2">
            {items.map((item) => {
              const isOutOfStock = item.stock !== undefined && item.stock <= 0;
              const hasInsufficientStock = item.stock !== undefined && item.quantity > item.stock;
              return (
                <div key={item._id} className="flex justify-between items-start text-sm border-b border-gray-100 pb-2">
                  <div className="flex flex-col max-w-[70%]">
                    <p className="text-gray-650 font-medium mb-0 truncate">
                      {item.name} <span className="text-xs text-gray-400 font-bold ml-1">x {item.quantity}</span>
                    </p>
                    {isOutOfStock ? (
                      <span className="text-[10px] text-red-650 font-bold mt-0.5">Out of Stock</span>
                    ) : hasInsufficientStock ? (
                      <span className="text-[10px] text-orange-600 font-bold mt-0.5">Only {item.stock} available</span>
                    ) : null}
                  </div>
                  <p className="font-medium text-gray-700 mb-0">
                    {formatPrice(item.price * (isOutOfStock ? 0 : item.quantity))}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 pb-4 border-b border-gray-300">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-700">Subtotal</span>
              <span className="text-gray-600 font-medium">{formatPrice(getTotal())}</span>
            </div>
            <div className="flex justify-between items-center text-base font-bold text-gray-900 mt-2">
              <span>Total</span>
              <span className="text-[#B88E2F] text-lg">{formatPrice(getTotal())}</span>
            </div>
          </div>

          {/* Payment method text description */}
          <div className="text-xs text-gray-500 space-y-3 mt-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
              Direct Bank Transfer
            </div>
            <p className="leading-relaxed">
              Make your payment directly into our bank account. Please use your Order ID as the payment reference. Your order will not be shipped until the funds have cleared in our account.
            </p>
          </div>

          {items.some(item => item.stock !== undefined && (item.stock <= 0 || item.quantity > item.stock)) && (
            <p className="text-xs text-red-650 font-semibold mt-4 text-center leading-normal">
              ⚠️ Your cart contains out-of-stock items or quantities exceeding available stock. Please adjust your cart.
            </p>
          )}

          <button 
            onClick={handlePlaceOrder}
            disabled={items.some(item => item.stock !== undefined && (item.stock <= 0 || item.quantity > item.stock))}
            className={`w-full py-3 text-white font-bold rounded shadow transition duration-300 mt-4 ${
              items.some(item => item.stock !== undefined && (item.stock <= 0 || item.quantity > item.stock))
                ? "bg-gray-400 cursor-not-allowed opacity-65"
                : "bg-[#B88E2F] hover:bg-[#a5761f]"
            }`}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Bill;