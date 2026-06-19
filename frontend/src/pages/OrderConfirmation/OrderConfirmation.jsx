import React from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";
import Location from "../../components/Location";
import { formatPrice } from "../../data/productData";

const OrderConfirmation = () => {
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Location title="Order Confirmation" breadcrumb="Confirmation" />
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="bg-white p-8 md:p-12 rounded-xl shadow-md max-w-2xl w-full text-center border border-gray-100">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Thank you for your purchase!</h2>
          <p className="text-gray-600 mb-8">
            Your order has been placed successfully. We are preparing it for shipment.
          </p>

          {order ? (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left border border-gray-200">
              <h3 className="font-semibold text-lg text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Order Summary
              </h3>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-mono font-bold text-gray-900">{order.id}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-900">{order.date}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-500">Total:</span>
                <span className="font-bold text-[#B88E2F]">
                  {formatPrice(order.total)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Shipping Address</h4>
                <p className="text-sm text-gray-600">
                  {order.shippingDetails?.firstName} {order.shippingDetails?.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {order.shippingDetails?.streetAddress}, {order.shippingDetails?.townCity}
                </p>
                <p className="text-sm text-gray-600">
                  {order.shippingDetails?.province}, {order.shippingDetails?.zipCode}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-8">
              No recent order details found. Please visit your Order History to view past purchases.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/orders"
              className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-md font-semibold hover:border-black hover:text-black transition flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" /> View My Orders
            </Link>
            <Link
              to="/shop"
              className="bg-[#B88E2F] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#a5761f] transition flex items-center justify-center gap-2"
            >
              Continue Shopping <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
