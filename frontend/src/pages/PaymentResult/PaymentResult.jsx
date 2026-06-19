import React from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, XCircle, Clock, ShoppingBag, ArrowRight, RefreshCw } from "lucide-react";
import Location from "../../components/Location";

const PaymentResult = () => {
  const location = useLocation();
  const { status, order, errorMessage } = location.state || {};

  const statusConfig = {
    success: {
      icon: <CheckCircle className="w-24 h-24 text-green-500" />,
      bgGradient: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      title: "Payment Successful!",
      subtitle: "Your order has been placed successfully.",
      description: "We're preparing your order for shipment. You'll receive a confirmation email shortly.",
      accentColor: "text-green-600",
    },
    failed: {
      icon: <XCircle className="w-24 h-24 text-red-500" />,
      bgGradient: "from-red-50 to-rose-50",
      borderColor: "border-red-200",
      title: "Payment Failed",
      subtitle: "Your payment could not be processed.",
      description: errorMessage || "The transaction was declined. Please try again or use a different payment method.",
      accentColor: "text-red-600",
    },
    pending: {
      icon: <Clock className="w-24 h-24 text-amber-500" />,
      bgGradient: "from-amber-50 to-yellow-50",
      borderColor: "border-amber-200",
      title: "Payment Processing",
      subtitle: "Your payment is being verified.",
      description: "This may take a few minutes. We'll update your order status once the payment is confirmed. Please do not retry.",
      accentColor: "text-amber-600",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Location title="Payment Status" breadcrumb="Payment" />
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className={`bg-gradient-to-br ${config.bgGradient} p-8 md:p-12 rounded-2xl shadow-lg max-w-2xl w-full text-center border ${config.borderColor}`}>
          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <div className={`${status === 'success' ? 'animate-bounce' : status === 'pending' ? 'animate-pulse' : 'animate-none'}`}>
              {config.icon}
            </div>
          </div>

          <h2 className={`text-3xl font-bold mb-2 ${config.accentColor}`}>
            {config.title}
          </h2>
          <p className="text-gray-700 font-medium text-lg mb-2">
            {config.subtitle}
          </p>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {config.description}
          </p>

          {/* Order details for success */}
          {status === "success" && order && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-8 text-left border border-gray-200/50 shadow-sm">
              <h3 className="font-semibold text-lg text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-900">{order.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Items:</span>
                  <span className="text-gray-900">{order.items?.length || 0} product(s)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-700">Total:</span>
                  <span className="font-bold text-[#B88E2F] text-lg">
                    ₹{new Intl.NumberFormat("en-IN").format(order.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {status === "success" && (
              <>
                <Link
                  to="/orders"
                  className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-black hover:text-black transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingBag className="w-5 h-5" /> View My Orders
                </Link>
                <Link
                  to="/shop"
                  className="bg-[#B88E2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#a5761f] transition flex items-center justify-center gap-2 shadow-md"
                >
                  Continue Shopping <ArrowRight className="w-5 h-5" />
                </Link>
              </>
            )}

            {status === "failed" && (
              <>
                <Link
                  to="/checkout"
                  className="bg-[#B88E2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#a5761f] transition flex items-center justify-center gap-2 shadow-md"
                >
                  <RefreshCw className="w-5 h-5" /> Retry Payment
                </Link>
                <Link
                  to="/cart"
                  className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-black hover:text-black transition flex items-center justify-center gap-2 shadow-sm"
                >
                  Go to Cart
                </Link>
              </>
            )}

            {status === "pending" && (
              <>
                <Link
                  to="/orders"
                  className="bg-[#B88E2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#a5761f] transition flex items-center justify-center gap-2 shadow-md"
                >
                  <ShoppingBag className="w-5 h-5" /> View My Orders
                </Link>
                <Link
                  to="/shop"
                  className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-black hover:text-black transition flex items-center justify-center gap-2 shadow-sm"
                >
                  Continue Shopping
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
