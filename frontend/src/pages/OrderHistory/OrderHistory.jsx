import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useOrderStore } from "../../store/store";
import { ShoppingBag, ArrowRight, Eye, ChevronDown, ChevronUp, Package, MapPin, CreditCard } from "lucide-react";
import Location from "../../components/Location";
import { useAuth } from "@clerk/clerk-react";
import { formatPrice } from "../../data/productData";
import api from "../../utils/api";

const OrderHistory = () => {
  const { orders, fetchOrders, loading } = useOrderStore();
  const { getToken } = useAuth();
  
  const [payments, setPayments] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const loadOrdersAndPayments = async () => {
      try {
        const token = await getToken();
        await fetchOrders(token);
        
        // Fetch Associated Payment History
        const payData = await api("/api/payments/history", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setPayments(payData.payments || []);
      } catch (err) {
        console.error("Failed to load orders or payments:", err);
      }
    };
    loadOrdersAndPayments();
  }, []);

  const toggleRow = (orderId) => {
    setExpandedId(expandedId === orderId ? null : orderId);
  };

  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("placed") || s.includes("process") || s.includes("pending") || s.includes("paid")) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (s.includes("dispatched")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (s.includes("shipped")) {
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    }
    if (s.includes("out for delivery")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    if (s.includes("delivered") || s.includes("success")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (s.includes("refunded")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (s.includes("replaced")) {
      return "bg-teal-100 text-teal-800 border-teal-200";
    }
    if (s.includes("returned") || s.includes("return")) {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    if (s.includes("exchange") || s.includes("replace")) {
      return "bg-pink-100 text-pink-800 border-pink-200";
    }
    if (s.includes("failed")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Location title="Order History" breadcrumb="Orders" />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-gray-500 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <Location title="Order History" breadcrumb="Orders" />
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>
        
        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-150 text-center max-w-lg mx-auto">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders placed yet</h3>
            <p className="text-gray-500 mb-6">
              When you purchase products, your order details will be displayed here.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#B88E2F] text-white px-8 py-3 rounded-full hover:bg-[#a5761f] transition font-semibold shadow-sm"
            >
              Start Shopping <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-150 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 font-semibold text-sm border-b border-gray-200">
                    <th className="p-4 sm:p-6">Product</th>
                    <th className="p-4 sm:p-6">Order ID</th>
                    <th className="p-4 sm:p-6">Date</th>
                    <th className="p-4 sm:p-6">Status</th>
                    <th className="p-4 sm:p-6">Total Items</th>
                    <th className="p-4 sm:p-6">Amount</th>
                    <th className="p-4 sm:p-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {orders.map((order) => {
                    const associatedPayment = payments.find(p => p.razorpayOrderId === order.id);
                    const isExpanded = expandedId === order.id;

                    return (
                      <React.Fragment key={order.id}>
                        {/* Summary Row */}
                        <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                          <td className="p-4 sm:p-6">
                            {order.items && order.items.length > 0 ? (
                              <Link to={`/product/${order.items[0]._id || order.items[0].productId}`} className="flex items-center gap-3 hover:opacity-85 group transition no-underline">
                                <img
                                  src={order.items[0].image}
                                  alt={order.items[0].name}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm group-hover:border-[#B88E2F]"
                                />
                                <div className="hidden md:block text-xs text-left max-w-[130px]">
                                  <p className="font-bold text-gray-800 truncate mb-0">{order.items[0].name}</p>
                                  {order.items.length > 1 && (
                                    <p className="text-gray-400 text-xxs font-semibold mt-0.5">+{order.items.length - 1} more item(s)</p>
                                  )}
                                </div>
                              </Link>
                            ) : (
                              <span className="text-gray-400 text-xs italic">No items</span>
                            )}
                          </td>
                          <td className="p-4 sm:p-6 font-mono font-bold text-gray-900">{order.id}</td>
                          <td className="p-4 sm:p-6 text-gray-600">{order.date}</td>
                          <td className="p-4 sm:p-6">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                              {order.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-4 sm:p-6 text-gray-600">
                            {order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0}
                          </td>
                          <td className="p-4 sm:p-6 font-semibold text-gray-900">
                            {formatPrice(order.total)}
                          </td>
                          <td className="p-4 sm:p-6 flex items-center justify-center gap-3">
                            <Link
                              to={`/orders/${order.id}`}
                              className="inline-flex items-center gap-1.5 text-[#B88E2F] hover:text-[#906c20] font-semibold bg-[#faf3ea] hover:bg-[#f3e5ce] px-3.5 py-1.5 rounded-full text-xs transition"
                            >
                              <Eye className="w-4 h-4" /> View Order
                            </Link>
                            <button
                              onClick={() => toggleRow(order.id)}
                              className="inline-flex items-center gap-1 text-gray-600 hover:text-black font-medium transition py-1.5 px-3 rounded-full hover:bg-gray-100 text-xs"
                            >
                              {isExpanded ? (
                                <>Collapse <ChevronUp className="w-4 h-4" /></>
                              ) : (
                                <>Quick View <ChevronDown className="w-4 h-4" /></>
                              )}
                            </button>
                          </td>
                        </tr>

                         {/* Expanded Payment & Shipping Details Row */}
                         {isExpanded && (
                           <tr className="bg-gray-50/70 border-b border-gray-200">
                             <td colSpan={7} className="p-6">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                 {/* ⚡ Cancellation Refund Banner */}
                                 {order.status.toLowerCase() === "cancelled" && (
                                   <div className="col-span-1 md:col-span-3 bg-orange-50 border-l-4 border-orange-500 text-orange-900 p-4 rounded mb-2 shadow-xxs">
                                     <p className="font-semibold text-sm">Refund is initiated from our side to your original payment source.</p>
                                     <p className="text-xxs text-gray-500 mt-1">Our system has processed this cancellation. Razorpay refund details are shown under Payment details below.</p>
                                   </div>
                                 )}
                                {/* 📦 Products & Items column */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-xs">
                                  <h4 className="font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#B88E2F]" /> Ordered Items
                                  </h4>
                                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                                    {order.items?.map((item) => (
                                      <div key={item._id} className="flex gap-3 items-center py-1">
                                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded border border-gray-150 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-gray-900 truncate text-xs mb-0">{item.name}</p>
                                          <p className="text-gray-400 text-xxs font-mono mb-0">SKU: {item.sku}</p>
                                        </div>
                                        <div className="text-right text-xs">
                                          <p className="font-medium text-gray-700 mb-0">{item.quantity} × {formatPrice(item.price)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* 📍 Shipping Address column */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-xs">
                                  <h4 className="font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#B88E2F]" /> Shipping Details
                                  </h4>
                                  {order.shippingDetails ? (
                                    <div className="space-y-1 text-gray-600 text-xs">
                                      <p className="font-bold text-gray-800">
                                        {order.shippingDetails.firstName} {order.shippingDetails.lastName}
                                      </p>
                                      {order.shippingDetails.companyName && (
                                        <p className="text-gray-400 text-xxs">{order.shippingDetails.companyName}</p>
                                      )}
                                      <p>{order.shippingDetails.streetAddress}</p>
                                      <p>{order.shippingDetails.townCity}, {order.shippingDetails.zipCode}</p>
                                      <p className="pt-2 border-t border-gray-100 mt-2"><strong>Phone:</strong> {order.shippingDetails.phone}</p>
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 text-xs italic">No shipping details</p>
                                  )}
                                </div>

                                {/* 💳 Payment / Transaction column */}
                                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-xs">
                                  <h4 className="font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-[#B88E2F]" /> Payment Transaction
                                  </h4>
                                  {associatedPayment ? (
                                    <div className="space-y-2 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Method:</span>
                                        <span className="font-semibold text-gray-800">
                                          {associatedPayment.method ? associatedPayment.method.toUpperCase() : "RAZORPAY"}
                                          {associatedPayment.cardLast4 && ` •••• ${associatedPayment.cardLast4}`}
                                        </span>
                                      </div>
                                      {associatedPayment.vpa && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">UPI ID:</span>
                                          <span className="font-mono text-gray-800 text-xxs">{associatedPayment.vpa}</span>
                                        </div>
                                      )}
                                      {associatedPayment.bank && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Bank:</span>
                                          <span className="text-gray-800">{associatedPayment.bank}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Status:</span>
                                        <span className={`font-semibold capitalize ${
                                          associatedPayment.status === 'captured' ? 'text-green-600' :
                                          associatedPayment.status === 'failed' ? 'text-red-600' : 'text-amber-600'
                                        }`}>
                                          {associatedPayment.status}
                                        </span>
                                      </div>
                                      {associatedPayment.razorpayPaymentId && (
                                        <div className="flex justify-between border-t border-gray-100 pt-1 mt-1">
                                          <span className="text-gray-500">Payment ID:</span>
                                          <span className="font-mono text-gray-800 text-xxs">{associatedPayment.razorpayPaymentId}</span>
                                        </div>
                                      )}
                                      {associatedPayment.errorCode && (
                                        <div className="bg-red-50 text-red-700 p-2 rounded mt-2 border border-red-100">
                                          <p className="font-semibold mb-0">Error:</p>
                                          <p className="mb-0 text-xxs">{associatedPayment.errorDescription}</p>
                                        </div>
                                      )}
                                      {associatedPayment.refundId && (
                                        <div className="bg-purple-50 text-purple-700 p-2 rounded mt-2 border border-purple-100">
                                          <p className="font-semibold mb-0">Refund:</p>
                                          <p className="mb-0 text-xxs">Refund ID: {associatedPayment.refundId} | Amount: {formatPrice(associatedPayment.refundAmount)}</p>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-2 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Status:</span>
                                        <span className="text-gray-600">Pending / Processing</span>
                                      </div>
                                      <p className="text-gray-400 italic text-xxs mt-2 leading-relaxed">
                                        No detailed transaction record found. Payment might still be pending verification.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
