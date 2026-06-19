import { create } from "zustand";
import api from "../utils/api";

// Run one-time migration to clear legacy Paise values from localStorage
if (typeof window !== "undefined" && localStorage.getItem("furniro_currency_migrated") !== "true") {
  localStorage.removeItem("furniro_cart_items");
  localStorage.removeItem("furniro_wishlist_items");
  localStorage.removeItem("furniro_comparison_items");
  localStorage.removeItem("furniro_orders");
  localStorage.setItem("furniro_currency_migrated", "true");
}

// Helper to load state from localStorage
const loadFromStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error(`Error loading state for ${key}:`, error);
    return defaultValue;
  }
};

// Helper to save state to localStorage
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving state for ${key}:`, error);
  }
};

// Cart Store with persistence
export const useCartStore = create((set, get) => ({
  items: loadFromStorage("furniro_cart_items", []),
  
  addToCart: (product, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((item) => item._id === product._id);
      let newItems;
      if (existing) {
        newItems = state.items.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...state.items, { ...product, quantity }];
      }
      saveToStorage("furniro_cart_items", newItems);
      return { items: newItems };
    });
  },

  removeFromCart: (productId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item._id !== productId);
      saveToStorage("furniro_cart_items", newItems);
      return { items: newItems };
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => {
      const newItems = state.items.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      );
      saveToStorage("furniro_cart_items", newItems);
      return { items: newItems };
    });
  },

  clearCart: () => {
    saveToStorage("furniro_cart_items", []);
    set({ items: [] });
  },

  getTotal: () => {
    return get().items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));

// Wishlist Store with persistence
export const useWishlistStore = create((set, get) => ({
  items: loadFromStorage("furniro_wishlist_items", []),

  addToWishlist: (product) => {
    set((state) => {
      const exists = state.items.find((item) => item._id === product._id);
      if (exists) return state;
      const newItems = [...state.items, product];
      saveToStorage("furniro_wishlist_items", newItems);
      return { items: newItems };
    });
  },

  removeFromWishlist: (productId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item._id !== productId);
      saveToStorage("furniro_wishlist_items", newItems);
      return { items: newItems };
    });
  },

  isInWishlist: (productId) => {
    return get().items.some((item) => item._id === productId);
  },

  clearWishlist: () => {
    saveToStorage("furniro_wishlist_items", []);
    set({ items: [] });
  },
}));

// Product Comparison Store with persistence (max 3 items)
export const useComparisonStore = create((set, get) => ({
  items: loadFromStorage("furniro_comparison_items", []),

  addToComparison: (product) => {
    set((state) => {
      const exists = state.items.find((item) => item._id === product._id);
      if (exists) return state;
      if (state.items.length >= 3) {
        // Swap out the first one, or just ignore. Let's alert/warn or shift.
        // Let's keep a max of 3 items
        const newItems = [...state.items.slice(1), product];
        saveToStorage("furniro_comparison_items", newItems);
        return { items: newItems };
      }
      const newItems = [...state.items, product];
      saveToStorage("furniro_comparison_items", newItems);
      return { items: newItems };
    });
  },

  removeFromComparison: (productId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item._id !== productId);
      saveToStorage("furniro_comparison_items", newItems);
      return { items: newItems };
    });
  },

  isInComparison: (productId) => {
    return get().items.some((item) => item._id === productId);
  },

  clearComparison: () => {
    saveToStorage("furniro_comparison_items", []);
    set({ items: [] });
  },
}));

// Order Store for checkout records
export const useOrderStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async (token) => {
    set({ loading: true, error: null });
    try {
      const data = await api("/api/orders/my-orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      const formattedOrders = (data.orders || []).map(order => {
        let displayStatus = order.status;
        if (order.status === "pending" || order.status === "paid") {
          displayStatus = "Order Placed";
        } else if (order.status === "failed") {
          displayStatus = "Order Failed";
        } else {
          displayStatus = order.status.charAt(0).toUpperCase() + order.status.slice(1);
        }

        return {
          id: order.razorpayOrderId || order._id,
          date: new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          status: displayStatus,
          items: order.items.map(item => ({
            ...item,
            _id: item.productId // map to frontend expected _id field
          })),
          total: order.totalAmount,
          shippingDetails: order.shippingAddress
        };
      });

      set({ orders: formattedOrders, loading: false });
    } catch (err) {
      console.error("Error fetching orders:", err);
      const local = loadFromStorage("furniro_orders", []);
      set({ orders: local, loading: false });
    }
  },

  placeOrder: (orderDetails) => {
    let mappedStatus = orderDetails.status || "Order Under Process";
    if (mappedStatus.toLowerCase() === "paid" || mappedStatus.toLowerCase() === "pending") {
      mappedStatus = "Order Placed";
    } else if (mappedStatus.toLowerCase() === "failed") {
      mappedStatus = "Order Failed";
    }

    const newOrder = {
      id: orderDetails.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      ...orderDetails,
      status: mappedStatus,
    };
    
    set((state) => {
      const newOrders = [newOrder, ...state.orders];
      saveToStorage("furniro_orders", newOrders);
      return { orders: newOrders };
    });

    return newOrder;
  },

  getOrderById: (orderId) => {
    return get().orders.find((o) => o.id === orderId);
  },
}));

