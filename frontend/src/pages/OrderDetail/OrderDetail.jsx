import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { 
  ArrowLeft, Calendar, MapPin, CreditCard, Package, 
  RefreshCw, AlertTriangle, AlertCircle, CheckCircle, Truck, Eye
} from "lucide-react";
import Location from "../../components/Location";
import { formatPrice } from "../../data/productData";
import { useCartStore } from "../../store/store";
import api from "../../utils/api";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { addToCart } = useCartStore();

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'cancel' | 'return' | 'exchange' | null
  const [reason, setReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const fetchOrderAndPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch Order Details
      const orderData = await api(`/api/orders/${id}`, { headers });
      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to fetch order details");
      }
      setOrder(orderData.order);

      // Fetch linked payment history to find matching payment record if exists
      try {
        const payData = await api("/api/payments/history", { headers });
        if (payData.success && payData.payments) {
          const match = payData.payments.find(p => p.razorpayOrderId === orderData.order.razorpayOrderId);
          if (match) {
            setPayment(match);
          }
        }
      } catch (err) {
        console.warn("Could not load associated payment detail:", err);
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while fetching the order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndPayment();
  }, [id]);

  const handleAction = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setActionMessage("Please provide a reason.");
      return;
    }

    setSubmittingAction(true);
    setActionMessage("");

    try {
      const token = await getToken();
      const endpoint = `/api/orders/${order._id}/${activeModal}`;
      const res = await api(endpoint, {
        method: "PUT",
        body: { reason },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.success) {
        setActiveModal(null);
        setReason("");
        // Reload order state
        await fetchOrderAndPayment();
      } else {
        setActionMessage(res.message || `Failed to submit request to ${activeModal} order.`);
      }
    } catch (err) {
      console.error(err);
      setActionMessage(err.message || "Server error while performing action.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReorder = async () => {
    setSubmittingAction(true);
    try {
      const token = await getToken();
      const res = await api(`/api/orders/${order._id}/reorder`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.success && res.items) {
        // Add all items to cart
        res.items.forEach(item => {
          addToCart({
            _id: item.productId,
            name: item.name,
            sku: item.sku,
            price: item.price,
            image: item.image
          }, item.quantity);
        });
        navigate("/checkout");
      } else {
        alert(res.message || "Failed to reorder items due to stock limitations.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Server error while reordering.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      paid: "bg-amber-100 text-amber-800 border-amber-200",
      dispatched: "bg-blue-100 text-blue-800 border-blue-200",
      shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
      out_for_delivery: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancel_requested: "bg-amber-100 text-amber-800 border-amber-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
      return_requested: "bg-purple-100 text-purple-800 border-purple-200",
      returned: "bg-rose-100 text-rose-800 border-rose-200",
      exchange_requested: "bg-pink-100 text-pink-800 border-pink-200",
      replaced: "bg-teal-100 text-teal-800 border-teal-200",
      refunded: "bg-emerald-100 text-emerald-800 border-emerald-200",
      failed: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "ORDER PLACED",
      paid: "ORDER PLACED",
      dispatched: "DISPATCHED",
      shipped: "SHIPPED",
      out_for_delivery: "OUT FOR DELIVERY",
      delivered: "DELIVERED",
      cancel_requested: "CANCELLATION REQUESTED",
      cancelled: "CANCELLED",
      return_requested: "RETURN REQUESTED",
      returned: "RETURNED",
      exchange_requested: "REPLACE REQUESTED",
      replaced: "REPLACED",
      refunded: "REFUNDED",
      failed: "ORDER FAILED"
    };
    return labels[status] || (status ? status.replace("_", " ").toUpperCase() : "ORDER PLACED");
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Location title="Order Details" breadcrumb="Order Details" />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-gray-500 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Location title="Order Details" breadcrumb="Order Details" />
        <div className="container mx-auto px-4 py-16 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6">{error || "The requested order could not be located."}</p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 bg-[#B88E2F] text-white px-6 py-3 rounded-full hover:bg-[#a5761f] transition font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <Location title={`Order #${order.razorpayOrderId || order._id}`} breadcrumb="Order Detail" />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        {/* Top Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">
                Order ID: <span className="font-mono">{order.razorpayOrderId || order._id}</span>
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </p>
          </div>

          {/* Action Buttons based on order status */}
          <div className="flex flex-wrap gap-3">
            {["paid", "pending"].includes(order.status) && (
              <button
                onClick={() => setActiveModal("cancel")}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-5 py-2.5 rounded-full font-semibold text-sm transition"
              >
                Cancel Order
              </button>
            )}

            {order.status === "delivered" && (
              <>
                <button
                  onClick={() => setActiveModal("return")}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 px-5 py-2.5 rounded-full font-semibold text-sm transition"
                >
                  Return Items
                </button>
                <button
                  onClick={() => setActiveModal("exchange")}
                  className="bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 px-5 py-2.5 rounded-full font-semibold text-sm transition"
                >
                  Exchange Items
                </button>
              </>
            )}

            <button
              onClick={handleReorder}
              disabled={submittingAction}
              className="bg-[#B88E2F] hover:bg-[#a5761f] text-white px-6 py-2.5 rounded-full font-semibold text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${submittingAction ? 'animate-spin' : ''}`} />
              Reorder Items
            </button>
          </div>
        </div>

        {/* 5-Stage Shipment & Delivery Tracker */}
        {!["failed", "cancelled", "refunded", "returned", "replaced"].includes(order.status) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-0">
                <Truck className="w-4 h-4 text-[#B88E2F]" /> Shipment & Delivery Tracker
              </h3>
              {order.courierPartner && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                  Carrier: <strong>{order.courierPartner}</strong> {order.trackingNumber && `(#${order.trackingNumber})`}
                </span>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative">
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-gray-200 hidden md:block z-0" />
              
              {/* Step 1: Order Placed */}
              <div className="flex items-center md:flex-col gap-3 md:gap-2 z-10 bg-white pr-2 md:pr-0 md:w-1/5 text-left md:text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                  ["paid", "pending", "dispatched", "shipped", "out_for_delivery", "delivered"].includes(order.status)
                    ? "bg-[#B88E2F] border-[#B88E2F] text-white shadow-sm"
                    : "bg-gray-100 border-gray-300 text-gray-500"
                }`}>
                  1
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-xs mb-0">Order Placed</p>
                  <p className="text-[10px] text-gray-400 mb-0">Confirmed & Processing</p>
                </div>
              </div>

              {/* Step 2: Dispatched */}
              <div className="flex items-center md:flex-col gap-3 md:gap-2 z-10 bg-white px-2 md:px-0 md:w-1/5 text-left md:text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                  ["dispatched", "shipped", "out_for_delivery", "delivered"].includes(order.status)
                    ? "bg-[#B88E2F] border-[#B88E2F] text-white shadow-sm"
                    : "bg-gray-100 border-gray-300 text-gray-500"
                }`}>
                  2
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-xs mb-0">Dispatched</p>
                  <p className="text-[10px] text-gray-400 mb-0">Packed at warehouse</p>
                </div>
              </div>

              {/* Step 3: Shipped */}
              <div className="flex items-center md:flex-col gap-3 md:gap-2 z-10 bg-white px-2 md:px-0 md:w-1/5 text-left md:text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                  ["shipped", "out_for_delivery", "delivered"].includes(order.status)
                    ? "bg-[#B88E2F] border-[#B88E2F] text-white shadow-sm"
                    : "bg-gray-100 border-gray-300 text-gray-500"
                }`}>
                  3
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-xs mb-0">Shipped</p>
                  <p className="text-[10px] text-gray-400 mb-0">In transit to hub</p>
                </div>
              </div>

              {/* Step 4: Out for Delivery */}
              <div className="flex items-center md:flex-col gap-3 md:gap-2 z-10 bg-white px-2 md:px-0 md:w-1/5 text-left md:text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                  ["out_for_delivery", "delivered"].includes(order.status)
                    ? "bg-[#B88E2F] border-[#B88E2F] text-white shadow-sm"
                    : "bg-gray-100 border-gray-300 text-gray-500"
                }`}>
                  4
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-xs mb-0">Out for Delivery</p>
                  <p className="text-[10px] text-gray-400 mb-0">Carrier arriving today</p>
                </div>
              </div>

              {/* Step 5: Delivered */}
              <div className="flex items-center md:flex-col gap-3 md:gap-2 z-10 bg-white pl-2 md:pl-0 md:w-1/5 text-left md:text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                  order.status === "delivered"
                    ? "bg-green-500 border-green-500 text-white shadow-sm"
                    : "bg-gray-100 border-gray-300 text-gray-500"
                }`}>
                  5
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-xs mb-0">Delivered</p>
                  <p className="text-[10px] text-gray-400 mb-0">Signed & completed</p>
                </div>
              </div>
            </div>

            {order.deliveryNotes && (
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                <strong>Delivery Note:</strong> {order.deliveryNotes}
              </div>
            )}
          </div>
        )}

        {/* Cancellation Requested Notice */}
        {order.status === "cancel_requested" && (
          <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-950 p-4 mb-6 rounded-lg shadow-sm">
            <span className="font-semibold block text-sm flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Cancellation Request Under Review
            </span>
            <p className="text-sm mt-1">
              Your cancellation request is currently under review by our admin team. Once approved, your refund will be initiated immediately.
            </p>
            {order.cancellationReason && (
              <p className="text-xs italic text-amber-800 mt-2">
                Reason: "{order.cancellationReason}"
              </p>
            )}
          </div>
        )}

        {/* Cancellation details notice */}
        {order.status === "cancelled" && (
          <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-950 p-4 mb-6 rounded-lg shadow-sm">
            <span className="font-semibold block text-sm flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Order Cancelled
            </span>
            <p className="text-sm mt-1">
              This order has been cancelled and refund has been initiated to your original payment source.
            </p>
            {(order.refundId || payment?.refundId) && (
              <div className="mt-2 pt-2 border-t border-orange-200/50 text-xs text-orange-700 space-y-1">
                <p><strong>Refund Status:</strong> Processed / Initiated</p>
                <p><strong>Refund ID:</strong> <span className="font-mono">{order.refundId || payment?.refundId}</span></p>
                <p><strong>Refund Amount:</strong> {formatPrice(order.refundAmount || payment?.refundAmount || order.totalAmount)}</p>
              </div>
            )}
            {order.cancellationReason && (
              <p className="text-xs italic text-orange-700 mt-2">
                Reason: "{order.cancellationReason}"
              </p>
            )}
          </div>
        )}

        {/* Refunded notice */}
        {order.status === "refunded" && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-950 p-4 mb-6 rounded-lg shadow-sm">
            <span className="font-semibold block text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Refund Processed
            </span>
            <p className="text-sm mt-1">
              A full refund of <strong>{formatPrice(order.refundAmount || order.totalAmount)}</strong> has been processed to your original payment account.
            </p>
            {(order.refundId || payment?.refundId) && (
              <p className="text-xs text-emerald-800 mt-1 font-mono">
                Refund Ref ID: {order.refundId || payment?.refundId}
              </p>
            )}
          </div>
        )}

        {/* Replaced notice */}
        {order.status === "replaced" && (
          <div className="bg-teal-50 border-l-4 border-teal-500 text-teal-950 p-4 mb-6 rounded-lg shadow-sm">
            <span className="font-semibold block text-sm flex items-center gap-1">
              <RefreshCw className="w-4 h-4 text-teal-500" /> Replacement Fulfilled
            </span>
            <p className="text-sm mt-1">
              Your replacement request has been completed and dispatched.
            </p>
          </div>
        )}

        {/* Returned notice */}
        {order.status === "returned" && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-950 p-4 mb-6 rounded-lg shadow-sm">
            <span className="font-semibold block text-sm flex items-center gap-1">
              <Package className="w-4 h-4 text-rose-500" /> Order Returned
            </span>
            <p className="text-sm mt-1">
              The returned items have been received at our warehouse and verified.
            </p>
          </div>
        )}

        {order.status === "return_requested" && order.returnReason && (
          <div className="bg-purple-50 border-l-4 border-purple-400 text-purple-700 p-4 mb-6 rounded-lg shadow-sm">
            <span className="font-semibold block text-sm">Return Request Under Review:</span>
            <p className="text-sm italic mt-1">"{order.returnReason}"</p>
          </div>
        )}
        {order.status === "exchange_requested" && order.exchangeReason && (
          <div className="bg-pink-50 border-l-4 border-pink-400 text-pink-700 p-4 mb-6 rounded-lg shadow-sm">
            <span className="font-semibold block text-sm">Replace / Exchange Request Under Review:</span>
            <p className="text-sm italic mt-1">"{order.exchangeReason}"</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items & Product Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#B88E2F]" /> Order Items
              </h2>

              <div className="divide-y divide-gray-250">
                {order.items?.map((item) => (
                  <div key={item._id} className="py-4 flex gap-4 items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-950 text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {item.sku}</p>
                      {/* Optional metadata sizes/colors */}
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        {item.size && <span>Size: <strong className="text-gray-700">{item.size}</strong></span>}
                        {item.color && <span>Color: <strong className="text-gray-700">{item.color}</strong></span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900 text-sm">{formatPrice(item.price)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                      <p className="font-bold text-gray-950 text-sm mt-1">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Box */}
              <div className="border-t border-gray-200 mt-6 pt-4 space-y-2 text-sm text-right flex flex-col items-end">
                <div className="flex justify-between w-64">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-medium text-gray-900">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between w-64">
                  <span className="text-gray-500">Shipping:</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between w-64 border-t border-gray-150 pt-2 text-base font-bold">
                  <span className="text-gray-900">Total Paid:</span>
                  <span className="text-[#B88E2F]">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Address Details */}
          <div className="space-y-6">
            {/* Delivery address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#B88E2F]" /> Shipping Address
              </h2>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-bold text-gray-900">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                {order.shippingAddress.companyName && (
                  <p className="text-gray-500 text-xs">{order.shippingAddress.companyName}</p>
                )}
                <p>{order.shippingAddress.streetAddress}</p>
                <p>
                  {order.shippingAddress.townCity}
                  {order.shippingAddress.province && `, ${order.shippingAddress.province}`}
                </p>
                <p>{order.shippingAddress.country} - {order.shippingAddress.zipCode}</p>
                <div className="pt-2 border-t border-gray-100 mt-2 space-y-0.5 text-xs text-gray-600">
                  <p><strong>Phone:</strong> {order.shippingAddress.phone}</p>
                  <p><strong>Email:</strong> {order.shippingAddress.email}</p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#B88E2F]" /> Payment Summary
              </h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method:</span>
                  <span className="font-semibold text-gray-800">
                    {payment?.method ? payment.method.toUpperCase() : "RAZORPAY"}
                  </span>
                </div>
                {payment?.cardLast4 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Card details:</span>
                    <span className="text-gray-800">•••• {payment.cardLast4}</span>
                  </div>
                )}
                {payment?.bank && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bank:</span>
                    <span className="text-gray-800">{payment.bank}</span>
                  </div>
                )}
                {payment?.vpa && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">UPI ID:</span>
                    <span className="text-gray-800 font-mono text-xs">{payment.vpa}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-semibold ${
                    order.status === 'paid' ? 'text-green-600' : 
                    order.status === 'failed' ? 'text-red-600' : 'text-gray-650'
                  }`}>
                    {order.status === 'paid' ? 'ORDER SUCCESS' : 
                     order.status === 'failed' ? 'ORDER FAILED' : 
                     order.status === 'pending' ? 'ORDER UNDER PROCESS' :
                     order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <h3 className="text-xl font-bold text-gray-900 capitalize">
                {activeModal} Order
              </h3>
            </div>
            
            <p className="text-gray-500 text-sm mb-4">
              Are you sure you want to {activeModal} this order? Please write down a reason to confirm.
            </p>

            <form onSubmit={handleAction}>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Reason for ${activeModal}...`}
                className="w-full border border-gray-300 rounded p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F] h-24 resize-none mb-3"
                required
              />

              {actionMessage && (
                <p className="text-xs text-red-500 mb-3">{actionMessage}</p>
              )}

              <div className="flex justify-end gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setReason("");
                    setActionMessage("");
                  }}
                  className="px-5 py-2 border border-gray-300 rounded-full font-semibold text-gray-700 hover:bg-gray-50 transition"
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition shadow-sm disabled:opacity-50"
                  disabled={submittingAction}
                >
                  {submittingAction ? "Submitting..." : `Confirm ${activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
