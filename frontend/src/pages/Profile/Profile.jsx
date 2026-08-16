import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { UserProfile, useAuth } from "@clerk/clerk-react";
import { User, MapPin, CreditCard, Save, RefreshCw, ChevronRight, CheckCircle, Info } from "lucide-react";
import Location from "../../components/Location";
import api from "../../utils/api";
import { formatPrice } from "../../data/productData";
import Loader from "../../components/Loader";

const Profile = () => {
  const { getToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "account";

  // Address state
  const [shippingForm, setShippingForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
    country: "India",
    streetAddress: "",
    townCity: "",
    province: "",
    zipCode: "",
    email: "",
  });

  const [billingForm, setBillingForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
    country: "India",
    streetAddress: "",
    townCity: "",
    province: "",
    zipCode: "",
    email: "",
  });

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState("");

  // Payments State
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Tabs config
  const tabs = [
    { id: "account", label: "My Account", icon: <User className="w-4 h-4" /> },
    { id: "address", label: "Address & Shipping", icon: <MapPin className="w-4 h-4" /> },
    { id: "payments", label: "Payments & Methods", icon: <CreditCard className="w-4 h-4" /> },
  ];

  // Fetch address and payment info
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        // Load User profile for addresses
        setLoadingAddress(true);
        const profileRes = await api("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes && profileRes.success && profileRes.user) {
          const u = profileRes.user;
          if (u.defaultAddress) {
            setShippingForm((prev) => ({ ...prev, ...u.defaultAddress }));
          }
          if (u.defaultBillingAddress) {
            setBillingForm((prev) => ({ ...prev, ...u.defaultBillingAddress }));
            
            // Check if billing matches shipping to toggle sameAddress checkbox
            const billingEmpty = !u.defaultBillingAddress.streetAddress;
            const billingMatches = JSON.stringify(u.defaultAddress) === JSON.stringify(u.defaultBillingAddress);
            setUseSameAddress(billingEmpty || billingMatches);
          }
        }
      } catch (err) {
        console.error("Failed to load user address profile:", err);
      } finally {
        setLoadingAddress(false);
      }
    };

    if (activeTab === "address") {
      fetchProfileData();
    }
  }, [activeTab, getToken]);

  useEffect(() => {
    const fetchPaymentsData = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        setLoadingPayments(true);
        // Load past payments
        const payRes = await api("/api/payments/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPayments(payRes.payments || []);

        // Load saved payment methods
        const methodsRes = await api("/api/payments/methods", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPaymentMethods(methodsRes);
      } catch (err) {
        console.error("Failed to load payments history/options:", err);
      } finally {
        setLoadingPayments(false);
      }
    };

    if (activeTab === "payments") {
      fetchPaymentsData();
    }
  }, [activeTab, getToken]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAddresses = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressMessage("");
    try {
      const token = await getToken();
      const payload = {
        defaultAddress: shippingForm,
        defaultBillingAddress: useSameAddress ? shippingForm : billingForm
      };
      const res = await api("/api/users/profile", {
        method: "PUT",
        body: payload,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.success) {
        setAddressMessage("Addresses updated successfully!");
        setTimeout(() => setAddressMessage(""), 3000);
      } else {
        setAddressMessage("Failed to save addresses.");
      }
    } catch (err) {
      console.error(err);
      setAddressMessage("Server error while updating addresses.");
    } finally {
      setSavingAddress(false);
    }
  };

  const selectTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const getStatusColor = (status) => {
    const colors = {
      created: "text-gray-500 bg-gray-100 border-gray-200",
      authorized: "text-blue-600 bg-blue-50 border-blue-200",
      captured: "text-green-600 bg-green-50 border-green-200",
      failed: "text-red-600 bg-red-50 border-red-200",
      refunded: "text-purple-600 bg-purple-50 border-purple-200",
    };
    return colors[status] || "text-gray-500 bg-gray-50 border-gray-250";
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <Location title="User Profile" breadcrumb="Profile" />
      
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar / Tabs Selector */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-1">
              <p className="text-xxs font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">Manage Profile</p>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-[#B88E2F] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
              
              {/* Account Settings Tab (Clerk UI) */}
              {activeTab === "account" && (
                <div className="flex items-center justify-center p-6 md:p-10 bg-gray-50/50">
                  <UserProfile 
                    routing="hash"
                    appearance={{
                      elements: {
                        card: "shadow-none border-none bg-transparent w-full p-0 m-0",
                        navbar: "hidden", // Hide clerk sidebar since we have custom tabs
                        pageScrollable: "p-0 w-full max-w-full",
                        profileSection__activeDevices: "hidden", // Optional customization
                      }
                    }}
                  />
                </div>
              )}

              {/* Address Tab */}
              {activeTab === "address" && (
                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-150 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Address & Shipping Details</h2>
                      <p className="text-gray-500 text-xs mt-1">Configure your default shipping and billing addresses for faster checkout.</p>
                    </div>
                  </div>

                  {loadingAddress ? (
                    <div className="py-20 flex justify-center items-center">
                      <Loader />
                    </div>
                  ) : (
                    <form onSubmit={handleSaveAddresses} className="space-y-8">
                      
                      {/* Shipping address form block */}
                      <div>
                        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                          <span className="w-1.5 h-4 bg-[#B88E2F] rounded-full"></span>
                          Default Shipping Address
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              value={shippingForm.firstName}
                              onChange={handleShippingChange}
                              className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              value={shippingForm.lastName}
                              onChange={handleShippingChange}
                              className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                            <input
                              type="text"
                              name="phone"
                              value={shippingForm.phone}
                              onChange={handleShippingChange}
                              className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                            <input
                              type="email"
                              name="email"
                              value={shippingForm.email}
                              onChange={handleShippingChange}
                              className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address</label>
                            <input
                              type="text"
                              name="streetAddress"
                              value={shippingForm.streetAddress}
                              onChange={handleShippingChange}
                              placeholder="House number and street name"
                              className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Town / City</label>
                            <input
                              type="text"
                              name="townCity"
                              value={shippingForm.townCity}
                              onChange={handleShippingChange}
                              className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Province / State</label>
                            <input
                              type="text"
                              name="province"
                              value={shippingForm.province}
                              onChange={handleShippingChange}
                              className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">ZIP / Postal Code</label>
                            <input
                              type="text"
                              name="zipCode"
                              value={shippingForm.zipCode}
                              onChange={handleShippingChange}
                              className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Country / Region</label>
                            <input
                              type="text"
                              name="country"
                              value={shippingForm.country}
                              onChange={handleShippingChange}
                              className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Same Address Checkbox */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-250/50">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSameAddress}
                            onChange={(e) => setUseSameAddress(e.target.checked)}
                            className="w-4 h-4 rounded text-[#B88E2F] focus:ring-[#B88E2F]"
                          />
                          <span className="text-sm font-semibold text-gray-700">Use shipping address as billing address</span>
                        </label>
                      </div>

                      {/* Billing Form block (conditionally rendered) */}
                      {!useSameAddress && (
                        <div className="pt-4 border-t border-gray-150 animate-fadeIn">
                          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                            <span className="w-1.5 h-4 bg-[#B88E2F] rounded-full"></span>
                            Default Billing Address
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                              <input
                                type="text"
                                name="firstName"
                                value={billingForm.firstName}
                                onChange={handleBillingChange}
                                className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                              <input
                                type="text"
                                name="lastName"
                                value={billingForm.lastName}
                                onChange={handleBillingChange}
                                className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                              <input
                                type="text"
                                name="phone"
                                value={billingForm.phone}
                                onChange={handleBillingChange}
                                className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                              <input
                                type="email"
                                name="email"
                                value={billingForm.email}
                                onChange={handleBillingChange}
                                className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address</label>
                              <input
                                type="text"
                                name="streetAddress"
                                value={billingForm.streetAddress}
                                onChange={handleBillingChange}
                                placeholder="House number and street name"
                                className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Town / City</label>
                              <input
                                type="text"
                                name="townCity"
                                value={billingForm.townCity}
                                onChange={handleBillingChange}
                                className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Province / State</label>
                              <input
                                type="text"
                                name="province"
                                value={billingForm.province}
                                onChange={handleBillingChange}
                                className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">ZIP / Postal Code</label>
                              <input
                                type="text"
                                name="zipCode"
                                value={billingForm.zipCode}
                                onChange={handleBillingChange}
                                className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Country / Region</label>
                              <input
                                type="text"
                                name="country"
                                value={billingForm.country}
                                onChange={handleBillingChange}
                                className="border border-gray-300 p-2 rounded w-full text-sm focus:outline-none focus:ring-1 focus:ring-[#B88E2F]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Status / Submit actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-gray-150">
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="bg-[#B88E2F] hover:bg-[#a5761f] text-white px-8 py-3 rounded-full font-bold text-sm shadow-md transition duration-200 flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50"
                        >
                          {savingAddress ? (
                            <>Saving... <RefreshCw className="w-4 h-4 animate-spin" /></>
                          ) : (
                            <>Save Addresses <Save className="w-4 h-4" /></>
                          )}
                        </button>

                        {addressMessage && (
                          <span className="text-sm font-semibold text-green-700 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> {addressMessage}
                          </span>
                        )}
                      </div>

                    </form>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === "payments" && (
                <div className="p-6 md:p-8 space-y-8">
                  
                  {/* Saved Payment Methods Details fetched from Razorpay */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-150 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#B88E2F]" /> Razorpay Payment Methods
                    </h2>
                    
                    {loadingPayments ? (
                      <div className="py-8 flex justify-center"><Loader /></div>
                    ) : paymentMethods ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Default Card */}
                        {paymentMethods.defaultMethod && (
                          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-md border border-gray-700/30 flex flex-col justify-between h-44 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 font-bold text-6xl pointer-events-none select-none">
                              VISA
                            </div>
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="bg-emerald-500/20 text-emerald-300 text-xxs font-bold py-1 px-2.5 rounded-full border border-emerald-500/30">DEFAULT METHOD</span>
                                <p className="text-xs text-gray-400 mt-2">Saved Card</p>
                              </div>
                              <span className="text-sm font-bold text-gray-300">Razorpay Tokenized</span>
                            </div>
                            <div>
                              <p className="font-mono text-lg tracking-wider">•••• •••• •••• {paymentMethods.defaultMethod.cardLast4}</p>
                              <div className="flex justify-between items-end mt-4">
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase">Card Holder</p>
                                  <p className="text-xs font-semibold">Saved Customer</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-400 uppercase">Expires</p>
                                  <p className="text-xs font-semibold">{paymentMethods.defaultMethod.expiry}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Other Methods */}
                        <div className="bg-gray-50 border border-gray-250/50 rounded-xl p-5 flex flex-col justify-between">
                          <div>
                            <p className="text-gray-500 text-xxs font-bold uppercase tracking-wider mb-3">Other Saved Instruments</p>
                            <div className="space-y-3">
                              {paymentMethods.savedMethods?.map((method, idx) => (
                                <div key={method.id || idx} className="flex items-center gap-3 bg-white p-2.5 rounded border border-gray-150">
                                  <span className="text-xl">{method.type === 'upi' ? '📱' : '💳'}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate mb-0">{method.name}</p>
                                    <p className="text-[10px] font-mono text-gray-400 truncate mb-0">
                                      {method.vpa || `•••• ${method.cardLast4}`}
                                    </p>
                                  </div>
                                  <span className="text-[10px] bg-gray-100 text-gray-500 py-0.5 px-2 rounded-full font-medium">Saved</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-2 text-xxs text-gray-500">
                            <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>Billing sources are synced dynamically with your Razorpay customer account configuration.</span>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs italic">Failed to fetch payment methods.</p>
                    )}
                  </div>

                  {/* Past Payments List */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 pb-2 border-b border-gray-150 mb-4">
                      Past Payments Transaction History
                    </h2>
                    
                    {loadingPayments ? (
                      <div className="py-8 flex justify-center"><Loader /></div>
                    ) : payments.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4 italic">No payment transactions recorded.</p>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                              <th className="p-3">Razorpay Order ID</th>
                              <th className="p-3">Date</th>
                              <th className="p-3">Method</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150">
                            {payments.map((p) => (
                              <tr key={p._id} className="hover:bg-gray-50/50 transition">
                                <td className="p-3 font-mono font-bold text-gray-900">{p.razorpayOrderId}</td>
                                <td className="p-3 text-gray-600">
                                  {new Date(p.createdAt).toLocaleDateString("en-IN", {
                                    year: "numeric", month: "short", day: "numeric"
                                  })}
                                </td>
                                <td className="p-3 text-gray-700 capitalize">
                                  {p.method ? p.method : "RAZORPAY"}
                                  {p.cardLast4 && ` (•••• ${p.cardLast4})`}
                                </td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(p.status)}`}>
                                    {p.status}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-gray-900">{formatPrice(p.amount)}</td>
                                <td className="p-3 text-right">
                                  <Link
                                    to={`/payments/${p._id}`}
                                    className="text-[#B88E2F] hover:text-[#9e761c] font-bold flex items-center justify-end gap-0.5 transition-colors"
                                  >
                                    View Details <ChevronRight className="w-3.5 h-3.5" />
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
