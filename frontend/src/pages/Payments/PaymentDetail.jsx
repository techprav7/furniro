import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { ArrowLeft, Calendar, CreditCard, ShoppingBag, AlertTriangle, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Location from "../../components/Location";
import { formatPrice } from "../../data/productData";
import api from "../../utils/api";
import Loader from "../../components/Loader";

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const data = await api(`/api/payments/${id}`, { headers });
        if (data.success && data.payment) {
          setPayment(data.payment);
        } else {
          throw new Error(data.message || "Failed to fetch payment details");
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong while retrieving the payment transaction");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetail();
  }, [id, getToken]);

  const getStatusBadge = (status) => {
    const styles = {
      created: "bg-gray-100 text-gray-700 border-gray-300",
      authorized: "bg-blue-100 text-blue-800 border-blue-300",
      captured: "bg-green-100 text-green-800 border-green-300",
      failed: "bg-red-100 text-red-800 border-red-300",
      refunded: "bg-purple-100 text-purple-800 border-purple-300",
    };
    const colors = styles[status] || "bg-gray-100 text-gray-700 border-gray-350";
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colors}`}>
        {status === 'captured' && <CheckCircle className="w-3.5 h-3.5" />}
        {status === 'failed' && <AlertCircle className="w-3.5 h-3.5" />}
        {status === 'refunded' && <RefreshCwIcon className="w-3.5 h-3.5 animate-spin-once" />}
        {status === 'created' && <Clock className="w-3.5 h-3.5" />}
        {status.toUpperCase()}
      </span>
    );
  };

  const RefreshCwIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
  );

  const getMethodLabel = (method) => {
    const labels = {
      card: "Credit / Debit Card",
      upi: "Unified Payments Interface (UPI)",
      netbanking: "Net Banking",
      wallet: "Digital Wallet",
      emi: "Equated Monthly Installments (EMI)",
      bank_transfer: "Direct Bank Transfer"
    };
    return labels[method] || "Razorpay Payment Channel";
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Location title="Transaction Details" breadcrumb="Payment Detail" />
        <div className="container mx-auto px-4 py-20 flex justify-center"><Loader /></div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Location title="Transaction Details" breadcrumb="Payment Detail" />
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaction Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "This transaction record could not be retrieved."}</p>
          <Link
            to="/profile?tab=payments"
            className="inline-flex items-center gap-2 bg-[#B88E2F] text-white px-6 py-3 rounded hover:bg-[#a5761f] transition font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Payment History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <Location title={`Transaction Detail`} breadcrumb="Payment Detail" />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          to="/profile?tab=payments"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile Payments
        </Link>

        {/* Payment Summary Box */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-6 md:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <p className="text-gray-400 text-xxs font-bold uppercase tracking-wider mb-1">Razorpay Transaction ID</p>
              <h1 className="text-xl font-bold text-gray-900 font-mono">
                {payment.razorpayPaymentId || payment._id}
              </h1>
              <p className="text-gray-500 text-xs mt-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Processed on {new Date(payment.createdAt).toLocaleString("en-IN", {
                  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
            <div>
              {getStatusBadge(payment.status)}
            </div>
          </div>

          {/* Refund Notice Banner */}
          {payment.status === "refunded" && (
            <div className="bg-purple-50 border-l-4 border-purple-500 text-purple-850 p-4 my-6 rounded-r-lg">
              <span className="font-semibold block text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-purple-600" /> Refund Disbursed
              </span>
              <p className="text-xs mt-1">
                Refund is initiated from our side to your original payment source. Depending on your financial institution, funds may reflect in your account within 5-7 business days.
              </p>
              <div className="mt-2.5 pt-2.5 border-t border-purple-200/50 text-[11px] space-y-1 font-mono text-purple-700">
                <p>Refund Transaction ID: {payment.refundId}</p>
                <p>Refund Amount: {formatPrice(payment.refundAmount || payment.amount)}</p>
              </div>
            </div>
          )}

          {/* Error Notice Banner */}
          {payment.status === "failed" && payment.errorCode && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-850 p-4 my-6 rounded-r-lg">
              <span className="font-semibold block text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" /> Payment Failed
              </span>
              <p className="text-xs mt-1 font-mono">
                Reason: {payment.errorCode} - {payment.errorDescription || "Declined by gateway."}
              </p>
            </div>
          )}

          {/* Transaction Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Payment Channel / Method</span>
              <p className="font-semibold text-gray-800 mt-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#B88E2F]" />
                {getMethodLabel(payment.method)}
              </p>
            </div>
            
            {payment.method === "card" && payment.cardLast4 && (
              <div>
                <span className="text-gray-500 text-xs">Card Info</span>
                <p className="font-semibold text-gray-800 font-mono mt-1">•••• •••• •••• {payment.cardLast4}</p>
              </div>
            )}

            {payment.method === "upi" && payment.vpa && (
              <div>
                <span className="text-gray-500 text-xs">UPI Address (VPA)</span>
                <p className="font-semibold text-gray-800 font-mono mt-1">{payment.vpa}</p>
              </div>
            )}

            {payment.method === "netbanking" && payment.bank && (
              <div>
                <span className="text-gray-500 text-xs">Clearing Institution / Bank</span>
                <p className="font-semibold text-gray-800 mt-1">{payment.bank}</p>
              </div>
            )}

            {payment.method === "wallet" && payment.wallet && (
              <div>
                <span className="text-gray-500 text-xs">Digital Wallet Provider</span>
                <p className="font-semibold text-gray-800 mt-1 uppercase">{payment.wallet}</p>
              </div>
            )}

            <div>
              <span className="text-gray-500 text-xs">Payer Email</span>
              <p className="font-semibold text-gray-800 mt-1">{payment.email || "N/A"}</p>
            </div>

            <div>
              <span className="text-gray-500 text-xs">Payer Phone</span>
              <p className="font-semibold text-gray-800 mt-1">{payment.contact || "N/A"}</p>
            </div>

            <div>
              <span className="text-gray-500 text-xs">Gross Transaction Value</span>
              <p className="font-bold text-gray-900 mt-1 text-lg">
                {formatPrice(payment.amount)} <span className="text-xs text-gray-400 font-normal">{payment.currency}</span>
              </p>
            </div>

            <div>
              <span className="text-gray-500 text-xs">Razorpay Order Reference</span>
              <p className="font-semibold text-gray-800 font-mono mt-1 text-xs">{payment.razorpayOrderId}</p>
            </div>
          </div>
        </div>

        {/* Associated Order Link Box */}
        {payment.orderId && (
          <div className="bg-[#faf3ea] rounded-xl p-6 border border-gray-250/50 shadow-xxs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-10 h-10 text-[#B88E2F] bg-white p-2.5 rounded-full border border-gray-200" />
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Linked Purchase Order</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Order Status: <span className="font-semibold uppercase">{payment.orderId.status.replace("_", " ")}</span>
                </p>
              </div>
            </div>
            <Link
              to={`/orders/${payment.orderId.razorpayOrderId || payment.orderId._id}`}
              className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-semibold px-4 py-2 rounded text-xs transition text-center shadow-xs flex items-center justify-center gap-1.5"
            >
              Inspect Order Details
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentDetail;
