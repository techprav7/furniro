import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layout/Layout";
import Home from "../pages/Home/Home";
import Contact from "../pages/Contact/Contact";
import Shop from "../pages/Shop/Shop";
import Cart from "../pages/Cart/Cart";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Profile from "../pages/Profile/Profile";
import Single_Product from "../pages/Single_Product/Single_Product";
import Product_Comparison from "../pages/Product_Comparison/Product_Comparison";
import CheckOut from "../pages/CheckOut/CheckOut";
import Wishlist from "../pages/Wishlist/Wishlist";
import OrderConfirmation from "../pages/OrderConfirmation/OrderConfirmation";
import OrderHistory from "../pages/OrderHistory/OrderHistory";
import PaymentResult from "../pages/PaymentResult/PaymentResult";
import OrderDetail from "../pages/OrderDetail/OrderDetail";
import PaymentDetail from "../pages/Payments/PaymentDetail";
import Error404 from "../pages/Error404/Error404";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "@clerk/clerk-react";

const AppRoutes = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full bg-[#f5f5f5] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth pages — no layout wrapper (full-screen backgrounds) */}
      <Route
        path="/login/*"
        element={isSignedIn ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/login"
        element={isSignedIn ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register/*"
        element={isSignedIn ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/register"
        element={isSignedIn ? <Navigate to="/" replace /> : <Register />}
      />
      <Route path="/sign-in/*" element={<Navigate to="/login" replace />} />
      <Route path="/signin" element={<Navigate to="/login" replace />} />
      <Route path="/sign-up/*" element={<Navigate to="/register" replace />} />
      <Route path="/signup" element={<Navigate to="/register" replace />} />

      {/* Main app — requires authentication */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="contact" element={<Contact />} />
        <Route path="cart" element={<Cart />} />
        <Route path="profile" element={<Profile />} />
        <Route path="product/:id" element={<Single_Product />} />
        <Route path="comparison" element={<Product_Comparison />} />
        <Route path="checkout" element={<CheckOut />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="order-confirmation" element={<OrderConfirmation />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="payments" element={<Navigate to="/profile?tab=payments" replace />} />
        <Route path="payments/:id" element={<PaymentDetail />} />
        <Route path="payment-result" element={<PaymentResult />} />
        <Route path="*" element={<Error404 />} />
      </Route>
    </Routes>
  );
};


export default AppRoutes;

