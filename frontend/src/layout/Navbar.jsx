import { useState, useRef, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../css/Navbar.css";
import logoImg from "../assets/Logo.png";
import { useCartStore, useWishlistStore } from "../store/store";
import { formatPrice } from "../data/productData";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { ShoppingBag, CreditCard, MapPin } from "lucide-react";

function NavbarComponent() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { items: cartItems, getTotal } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

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
    }
  };

  return (
    <Navbar expand="lg" className="bg-white py-3 shadow-sm position-sticky top-0 z-100">
      <Container fluid className="px-4">
        <div className="d-flex align-items-center justify-content-between w-100">
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <img
              src={logoImg}
              alt="Furniro Logo"
              style={{ height: "32px", width: "auto" }}
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
        </div>

        <Navbar.Collapse id="basic-navbar-nav" className="mt-3 mt-lg-0">
          <div className="d-flex flex-column flex-lg-row align-items-center w-100">
            <div className="d-none d-lg-flex justify-content-start flex-grow-1" />

            <div className="position-absolute start-50 translate-middle-x d-none d-lg-flex">
              <Nav className="flex-row text-center gap-4">
                {["Home", "Shop", "Blog", "Contact"].map((item) => (
                  <Nav.Link
                    key={item}
                    as={Link}
                    to={`/${item === "Home" ? "" : item.toLowerCase()}`}
                    className="text-dark fw-semibold nav-hover"
                  >
                    {item}
                  </Nav.Link>
                ))}
              </Nav>
            </div>

            <div className="d-flex flex-column flex-lg-row align-items-center justify-content-end flex-grow-1 order-3 gap-3 position-relative">
              <div className="d-flex gap-3 align-items-center">

                {/* 🔍 Search */}
                <span
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
                        className="position-absolute end-0 mt-2 p-3 bg-light border rounded shadow-sm"
                        style={{ width: "300px", zIndex: 999 }}
                      >
                        <input
                          type="text"
                          placeholder="Search for products..."
                          className="form-control"
                          value={searchVal}
                          onChange={(e) => setSearchVal(e.target.value)}
                          onKeyDown={handleSearchSubmit}
                          style={{
                            borderColor: "#B88E2F",
                            outline: "none",
                            boxShadow: "0 0 0 2px rgba(184, 142, 47, 0.3)",
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </span>

                {/* 💖 Wishlist */}
                <span
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
                        className="position-absolute end-0 mt-2 px-8 py-8 bg-light border rounded shadow-sm"
                        style={{ width: "370px", zIndex: 999 }}
                      >
                        <h3 className="d-block mb-1">Your Wishlist</h3>
                        <hr />
                        {wishlistItems.length > 0 ? (
                          <>
                            <ul className="list-unstyled mb-2">
                              {wishlistItems.map((item) => (
                                <li
                                  key={item._id}
                                  className="d-flex align-items-center mb-3"
                                  style={{ gap: "12px" }}
                                >
                                  <div className="flex-grow-1">
                                    <p className="mb-0 fw-semibold">{item.name}</p>
                                    <small className="text-muted">{formatPrice(item.price)}</small>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            <hr />
                            <div className="flex gap-4">
                              <Link to="/wishlist" className="btn btn-sm btn-dark" style={{ backgroundColor: "#B88E2F", borderColor: "#B88E2F" }}>View All</Link>
                            </div>
                          </>
                        ) : (
                          <p className="mb-0 text-muted">No favorites yet 💔</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </span>

                {/* 🛒 Cart */}
                <span
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
                        className="position-absolute end-0 mt-2 px-8 py-8 bg-light border rounded shadow-sm"
                        style={{ width: "370px", zIndex: 999 }}
                      >
                        <h3 className="d-block mb-1">Shopping Cart</h3>
                        <hr />
                        {cartItems.length > 0 ? (
                          <>
                            <ul className="list-unstyled mb-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                              {cartItems.map((item) => (
                                <li
                                  key={item._id}
                                  className="d-flex align-items-center mb-3"
                                  style={{ gap: "12px" }}
                                >
                                  <div className="flex-grow-1">
                                    <p className="mb-0 fw-semibold">{item.name}</p>
                                    <small className="text-muted">
                                      {item.quantity} × {formatPrice(item.price)}
                                    </small>
                                  </div>
                                </li>
                              ))}
                            </ul>
                            <div className="flex gap-4 mt-8">
                              <p>Subtotal</p>
                              <p className="text-[#B88E2F]">{formatPrice(getTotal())}</p>
                            </div>
                            <hr />
                            <div className="flex gap-4">
                              <Link to="/cart" className="btn btn-sm btn-dark" style={{ backgroundColor: "#B88E2F", borderColor: "#B88E2F" }}>Cart</Link>
                              <Link to="/checkout" className="btn btn-sm btn-dark" style={{ backgroundColor: "#B88E2F", borderColor: "#B88E2F" }}>Checkout</Link>
                              <Link to="/comparison" className="btn btn-sm btn-dark" style={{ backgroundColor: "#B88E2F", borderColor: "#B88E2F" }}>Comparison</Link>
                            </div>
                          </>
                        ) : (
                          <p className="mb-0 text-muted">Your cart is empty</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </span>
              </div>

              {/* Auth Buttons */}
              <div className="d-flex gap-2 flex-nowrap align-items-center">
                <SignedOut>
                  <Link
                    to="/login"
                    className="btn btn-outline-dark px-4 py-1"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-dark px-3 py-1"
                    style={{
                      backgroundColor: "#B88E2F",
                      borderColor: "#B88E2F",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Sign Up
                  </Link>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/login">
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

