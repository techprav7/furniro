import { useState, useRef, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../css/Navbar.css";

import { useCartStore, useWishlistStore } from "../store/store";
import { formatPrice } from "../data/productData";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { ShoppingBag, CreditCard, MapPin } from "lucide-react";

function NavbarComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const { items: cartItems, getTotal } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

  // Mobile menu expanded state
  const [expanded, setExpanded] = useState(false);

  // Cart
  const [showCartPopup, setShowCartPopup] = useState(false);
  const cartRef = useRef();
  const toggleCartPopup = () => setShowCartPopup((prev) => !prev);

  // Wishlist
  const [showWishlistPopup, setShowWishlistPopup] = useState(false);
  const wishlistRef = useRef();
  const toggleWishlistPopup = () => setShowWishlistPopup((prev) => !prev);

  // Search
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const searchRef = useRef();
  const toggleSearchPopup = () => setShowSearchPopup((prev) => !prev);

  // Close popups on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setShowCartPopup(false);
      }
      if (wishlistRef.current && !wishlistRef.current.contains(e.target)) {
        setShowWishlistPopup(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCartPopup, showWishlistPopup, showSearchPopup]);

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchVal.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
      setShowSearchPopup(false);
      setExpanded(false);
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Contact", path: "/contact" },
  ];

  const isRouteActive = (path) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/home";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Navbar 
      expand="lg" 
      expanded={expanded} 
      onToggle={(isExpanded) => setExpanded(isExpanded)}
      className="bg-white py-3 shadow-sm position-sticky top-0 z-100"
    >
      <Container fluid className="px-4">
        <div className="d-flex align-items-center justify-content-between w-100 d-lg-none">
          <Navbar.Brand as={Link} to="/" onClick={() => setExpanded(false)} className="d-flex align-items-center">
            <span
              style={{
                fontFamily: "'Outfit', 'Montserrat', sans-serif",
                fontSize: "24px",
                fontWeight: "600",
                letterSpacing: "4px",
                color: "#B88E2F",
                textDecoration: "none"
              }}
            >
              FURNIRO.
            </span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
        </div>

        <Navbar.Collapse id="basic-navbar-nav" className="mt-3 mt-lg-0">
          <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between w-100 position-relative">
            {/* Desktop Brand */}
            <div className="d-none d-lg-flex align-items-center flex-1 justify-content-start">
              <Navbar.Brand as={Link} to="/" className="d-flex align-items-center me-0">
                <span
                  style={{
                    fontFamily: "'Outfit', 'Montserrat', sans-serif",
                    fontSize: "24px",
                    fontWeight: "600",
                    letterSpacing: "4px",
                    color: "#B88E2F",
                    textDecoration: "none"
                  }}
                >
                  FURNIRO.
                </span>
              </Navbar.Brand>
            </div>

            {/* Desktop Navigation Links (Centered Animated Pill Track) */}
            <div className="d-none d-lg-flex align-items-center justify-content-center">
              <div className="nav-pill-track">
                {navLinks.map((item) => {
                  const active = isRouteActive(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`nav-tab-btn ${active ? "is-active" : ""}`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeNavTab"
                          className="position-absolute top-0 start-0 w-100 h-100 rounded-full"
                          style={{
                            backgroundColor: "#B88E2F",
                            boxShadow: "0 2px 10px rgba(184, 142, 47, 0.35)",
                            zIndex: 1,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 32,
                          }}
                        />
                      )}
                      <span style={{ position: "relative", zIndex: 2 }}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Mobile Navigation Links (Visible only on < lg) */}
            <div className="d-flex d-lg-none flex-column align-items-center w-100 my-3 py-2 border-b border-gray-200">
              <div className="d-flex flex-column text-center w-100 gap-2 px-2">
                {navLinks.map((item) => {
                  const active = isRouteActive(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setExpanded(false)}
                      className={`position-relative py-2.5 px-4 rounded-full text-base font-semibold transition-all duration-200 ${
                        active
                          ? "bg-[#B88E2F] text-white shadow-sm"
                          : "text-gray-800 hover:bg-[#faf3ea] hover:text-[#B88E2F]"
                      }`}
                      style={{ textDecoration: "none" }}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Icons and Auth Actions */}
            <div className="d-flex flex-column flex-lg-row align-items-center justify-content-end flex-1 gap-3 position-relative w-100 w-lg-auto">
              <div className="d-flex gap-4 align-items-center my-2 my-lg-0">

                {/* 🔍 Search */}
                <div
                  className="text-dark nav-icon-hover position-relative"
                  onClick={toggleSearchPopup}
                  style={{ cursor: "pointer" }}
                  ref={searchRef}
                >
                  <SearchOutlinedIcon />
                  <AnimatePresence>
                    {showSearchPopup && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="position-absolute end-0 mt-2 p-3 bg-white border border-gray-200 rounded-2xl shadow-lg"
                        style={{ width: "min(320px, 90vw)", zIndex: 999 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          placeholder="Search for products..."
                          className="form-control rounded-full px-3 py-2 text-sm"
                          value={searchVal}
                          onChange={(e) => setSearchVal(e.target.value)}
                          onKeyDown={handleSearchSubmit}
                          style={{
                            borderColor: "#B88E2F",
                            outline: "none",
                            boxShadow: "0 0 0 2px rgba(184, 142, 47, 0.2)",
                          }}
                          autoFocus
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 💖 Wishlist */}
                <div
                  className="text-dark nav-icon-hover position-relative"
                  onClick={toggleWishlistPopup}
                  style={{ cursor: "pointer" }}
                  ref={wishlistRef}
                >
                  <FavoriteBorderOutlinedIcon />
                  {wishlistItems.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "0.6rem" }}>
                      {wishlistItems.length}
                    </span>
                  )}
                  <AnimatePresence>
                    {showWishlistPopup && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="position-absolute end-0 mt-2 p-4 bg-white border border-gray-200 rounded-2xl shadow-lg"
                        style={{ width: "min(360px, 90vw)", zIndex: 999 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="text-lg font-bold mb-2 text-gray-800">Your Wishlist</h3>
                        <hr className="my-2 border-gray-200" />
                        {wishlistItems.length > 0 ? (
                          <>
                            <ul className="list-unstyled mb-3 max-h-[220px] overflow-y-auto space-y-2 pr-1">
                              {wishlistItems.map((item) => (
                                <li
                                  key={item._id}
                                  className="d-flex align-items-center gap-3 p-1 hover:bg-gray-50 rounded-lg"
                                >
                                  {item.image && (
                                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                                  )}
                                  <div className="flex-grow-1 min-w-0">
                                    <p className="mb-0 font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                                    <small className="text-muted">{formatPrice(item.price)}</small>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            <div className="d-flex gap-2">
                              <Link 
                                to="/wishlist" 
                                onClick={() => { setShowWishlistPopup(false); setExpanded(false); }}
                                className="btn btn-sm text-white w-100 font-semibold py-2 rounded-full" 
                                style={{ backgroundColor: "#B88E2F", borderColor: "#B88E2F" }}
                              >
                                View All
                              </Link>
                            </div>
                          </>
                        ) : (
                          <p className="mb-0 text-muted text-sm py-2">No favorites yet 💔</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 🛒 Cart */}
                <div
                  className="text-dark nav-icon-hover position-relative"
                  onClick={toggleCartPopup}
                  style={{ cursor: "pointer" }}
                  ref={cartRef}
                >
                  <ShoppingCartOutlinedIcon />
                  {cartItems.length > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "0.6rem" }}>
                      {cartItems.length}
                    </span>
                  )}
                  <AnimatePresence>
                    {showCartPopup && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="position-absolute end-0 mt-2 p-4 bg-white border border-gray-200 rounded-2xl shadow-lg"
                        style={{ width: "min(360px, 90vw)", zIndex: 999 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="text-lg font-bold mb-2 text-gray-800">Shopping Cart</h3>
                        <hr className="my-2 border-gray-200" />
                        {cartItems.length > 0 ? (
                          <>
                            <ul className="list-unstyled mb-3 max-h-[200px] overflow-y-auto space-y-2 pr-1">
                              {cartItems.map((item) => (
                                <li
                                  key={item._id}
                                  className="d-flex align-items-center gap-3 p-1 hover:bg-gray-50 rounded-lg"
                                >
                                  {item.image && (
                                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                                  )}
                                  <div className="flex-grow-1 min-w-0">
                                    <p className="mb-0 font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                                    <small className="text-muted">
                                      {item.quantity} × {formatPrice(item.price)}
                                    </small>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            <div className="d-flex justify-content-between mb-3 text-sm font-semibold">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="text-[#B88E2F]">{formatPrice(getTotal())}</span>
                            </div>
                            <div className="d-flex gap-2">
                              <Link 
                                to="/cart" 
                                onClick={() => { setShowCartPopup(false); setExpanded(false); }}
                                className="btn btn-sm text-white flex-1 font-semibold py-2 rounded-full" 
                                style={{ backgroundColor: "#B88E2F", borderColor: "#B88E2F" }}
                              >
                                Cart
                              </Link>
                              <Link 
                                to="/checkout" 
                                onClick={() => { setShowCartPopup(false); setExpanded(false); }}
                                className="btn btn-sm text-white flex-1 font-semibold py-2 rounded-full" 
                                style={{ backgroundColor: "#3A3A3A", borderColor: "#3A3A3A" }}
                              >
                                Checkout
                              </Link>
                            </div>
                          </>
                        ) : (
                          <p className="mb-0 text-muted text-sm py-2">Your cart is empty</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Auth Buttons */}
              <div className="d-flex gap-2 flex-nowrap align-items-center mt-2 mt-lg-0">
                <SignedOut>
                  <Link
                    to="/login"
                    onClick={() => setExpanded(false)}
                    className="btn btn-outline-dark px-4 py-1.5 rounded-full font-semibold text-sm transition-all"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setExpanded(false)}
                    className="btn btn-dark px-4 py-1.5 rounded-full font-semibold text-sm transition-all text-white"
                    style={{
                      backgroundColor: "#B88E2F",
                      borderColor: "#B88E2F",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Register
                  </Link>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/login" fallbackRedirectUrl="/login">
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="My Orders"
                        href="/orders"
                        labelIcon={<ShoppingBag className="w-4 h-4 text-gray-500" />}
                      />
                      <UserButton.Link
                        label="Address & Shipping"
                        href="/profile?tab=address"
                        labelIcon={<MapPin className="w-4 h-4 text-gray-500" />}
                      />
                      <UserButton.Link
                        label="Payments"
                        href="/profile?tab=payments"
                        labelIcon={<CreditCard className="w-4 h-4 text-gray-500" />}
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </SignedIn>
              </div>
            </div>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarComponent;
