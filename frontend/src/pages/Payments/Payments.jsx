import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { CreditCard, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import Location from "../../components/Location";
import { formatPrice } from "../../data/productData";
import api from "../../utils/api";

const Payments = () => {
  const { getToken } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const token = await getToken();
        const data = await api("/api/payments/history", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setPayments(data.payments || []);
      } catch (err) {
        console.error("Failed to load payments:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      created: "bg-gray-100 text-gray-700",
      authorized: "bg-blue-100 text-blue-800",
      captured: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-purple-100 text-purple-800",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  const getMethodIcon = (method) => {
    const icons = {
      card: "💳",
      upi: "📱",
      netbanking: "🏦",
      wallet: "👝",
    };
    return icons[method] || "💰";
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Location title="Payments" breadcrumb="Payments" />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-gray-500 font-medium">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Location title="Payments" breadcrumb="Payments" />
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h2>

        {payments.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-150 text-center max-w-lg mx-auto">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No payment history</h3>
            <p className="text-gray-500 mb-6">
              Your payment transactions will appear here after you make a purchase.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#B88E2F] text-white px-6 py-3 rounded hover:bg-[#a5761f] transition font-semibold"
            >
              Start Shopping <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="bg-white rounded-xl shadow-sm border border-gray-150 overflow-hidden transition-all duration-200"
              >
                {/* Payment row */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedId(expandedId === payment._id ? null : payment._id)}
                >
                  <div className="flex items-center gap-4 mb-2 sm:mb-0">
                    <span className="text-2xl">{getMethodIcon(payment.method)}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {payment.method ? payment.method.charAt(0).toUpperCase() + payment.method.slice(1) : "Payment"} 
                        {payment.cardLast4 && ` •••• ${payment.cardLast4}`}
                        {payment.vpa && ` (${payment.vpa})`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900">{formatPrice(payment.amount)}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                    {expandedId === payment._id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === payment._id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Razorpay Order ID</span>
                        <p className="font-mono text-gray-800 text-xs mt-1">{payment.razorpayOrderId}</p>
                      </div>
                      {payment.razorpayPaymentId && (
                        <div>
                          <span className="text-gray-500">Payment ID</span>
                          <p className="font-mono text-gray-800 text-xs mt-1">{payment.razorpayPaymentId}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Currency</span>
                        <p className="text-gray-800 mt-1">{payment.currency}</p>
                      </div>
                      {payment.method && (
                        <div>
                          <span className="text-gray-500">Method</span>
                          <p className="text-gray-800 mt-1">{payment.method}</p>
                        </div>
                      )}
                      {payment.bank && (
                        <div>
                          <span className="text-gray-500">Bank</span>
                          <p className="text-gray-800 mt-1">{payment.bank}</p>
                        </div>
                      )}
                      {payment.email && (
                        <div>
                          <span className="text-gray-500">Email</span>
                          <p className="text-gray-800 mt-1">{payment.email}</p>
                        </div>
                      )}
                      {payment.errorCode && (
                        <div className="sm:col-span-2">
                          <span className="text-red-500 font-medium">Error</span>
                          <p className="text-red-700 mt-1">{payment.errorCode}: {payment.errorDescription}</p>
                        </div>
                      )}
                      {payment.refundId && (
                        <div className="sm:col-span-2">
                          <span className="text-purple-500 font-medium">Refund</span>
                          <p className="text-gray-800 mt-1">Refund ID: {payment.refundId} | Amount: {formatPrice(payment.refundAmount)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
