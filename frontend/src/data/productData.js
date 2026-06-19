import image1 from "../assets/image1.png";
import image2 from "../assets/image2.png";
import image3 from "../assets/image3.png";
import image4 from "../assets/image4.png";
import image5 from "../assets/Image5.png";
import image6 from "../assets/image6.png";
import image7 from "../assets/image7.png";
import image8 from "../assets/image8.png";
import asgaard from "../assets/Asgaardsofa3.png";
import rect36 from "../assets/Rectangle36.png";
import rect37 from "../assets/Rectangle37.png";
import rect38 from "../assets/Rectangle38.png";
import rect39 from "../assets/Rectangle39.png";
import rect40 from "../assets/Rectangle40.png";
import rect41 from "../assets/Rectangle41.png";
import rect43 from "../assets/Rectangle43.png";
import small1 from "../assets/small1.png";
import small2 from "../assets/small2.png";
import small3 from "../assets/small3.png";

/**
 * Local product catalog — mirrors backend seed.js structure exactly.
 * When admin panel connects, replace these imports with API calls.
 */
const products = [
  {
    _id: "prod_001",
    name: "Syltherine",
    description:
      "Stylish cafe chair with premium wood finish and comfortable seating. Perfect for modern dining spaces.",
    price: 25000,
    originalPrice: 35000,
    discount: 30,
    category: "Dining",
    image: image1,
    images: [image1],
    stock: 15,
    rating: 4.5,
    reviewCount: 12,
    isFeatured: true,
    isNew: false,
    tags: ["chair", "dining", "wood"],
    sku: "FRN-DIN-001",
  },
  {
    _id: "prod_002",
    name: "Leviosa",
    description:
      "Elegant stylish cafe chair with ergonomic design. Built for comfort and style.",
    price: 25000,
    originalPrice: null,
    discount: 0,
    category: "Dining",
    image: image2,
    images: [image2],
    stock: 20,
    rating: 4.2,
    reviewCount: 8,
    isFeatured: true,
    isNew: false,
    tags: ["chair", "cafe", "modern"],
    sku: "FRN-DIN-002",
  },
  {
    _id: "prod_003",
    name: "Lolito",
    description:
      "Luxury big sofa that redefines comfort. Premium upholstery with deep cushioning for ultimate relaxation.",
    price: 70000,
    originalPrice: 140000,
    discount: 50,
    category: "Living Room",
    image: image3,
    images: [image3],
    stock: 5,
    rating: 4.8,
    reviewCount: 24,
    isFeatured: true,
    isNew: false,
    tags: ["sofa", "luxury", "living room"],
    sku: "FRN-LIV-001",
  },
  {
    _id: "prod_004",
    name: "Respira",
    description:
      "Outdoor bar table and stool set. Weather-resistant materials with contemporary design.",
    price: 5000,
    originalPrice: null,
    discount: 0,
    category: "Outdoor",
    image: image4,
    images: [image4],
    stock: 30,
    rating: 4.0,
    reviewCount: 6,
    isFeatured: true,
    isNew: true,
    tags: ["outdoor", "bar", "table"],
    sku: "FRN-OUT-001",
  },
  {
    _id: "prod_005",
    name: "Grifo",
    description:
      "Night lamp with warm ambient lighting. Minimalist design that complements any bedroom aesthetic.",
    price: 15000,
    originalPrice: null,
    discount: 0,
    category: "Bedroom",
    image: image6,
    images: [image6],
    stock: 40,
    rating: 4.3,
    reviewCount: 15,
    isFeatured: false,
    isNew: true,
    tags: ["lamp", "bedroom", "lighting"],
    sku: "FRN-BED-001",
  },
  {
    _id: "prod_006",
    name: "Muggo",
    description:
      "Small mug with elegant ceramic finish. Perfect for coffee enthusiasts who appreciate design.",
    price: 1500,
    originalPrice: null,
    discount: 0,
    category: "Dining",
    image: image7,
    images: [image7],
    stock: 100,
    rating: 4.1,
    reviewCount: 3,
    isFeatured: false,
    isNew: true,
    tags: ["mug", "kitchen", "ceramic"],
    sku: "FRN-DIN-003",
  },
  {
    _id: "prod_007",
    name: "Pingky",
    description:
      "Cute bed set with premium cotton linen. Soft pastel tones for a cozy bedroom atmosphere.",
    price: 70000,
    originalPrice: 140000,
    discount: 50,
    category: "Bedroom",
    image: image8,
    images: [image8],
    stock: 8,
    rating: 4.7,
    reviewCount: 19,
    isFeatured: false,
    isNew: false,
    tags: ["bed", "bedroom", "cotton"],
    sku: "FRN-BED-002",
  },
  {
    _id: "prod_008",
    name: "Potty",
    description:
      "Minimalist flower pot crafted from premium terracotta. Adds a natural touch to any space.",
    price: 5000,
    originalPrice: null,
    discount: 0,
    category: "Outdoor",
    image: image5,
    images: [image5],
    stock: 50,
    rating: 3.9,
    reviewCount: 7,
    isFeatured: false,
    isNew: true,
    tags: ["pot", "outdoor", "garden"],
    sku: "FRN-OUT-002",
  },
  {
    _id: "prod_009",
    name: "Asgaard Sofa",
    description:
      "Premium handcrafted sofa with Scandinavian design. Features solid oak frame and premium fabric upholstery. The centerpiece of any modern living room.",
    price: 250000,
    originalPrice: 300000,
    discount: 17,
    category: "Living Room",
    image: asgaard,
    images: [asgaard, small1, small2, small3],
    stock: 3,
    rating: 4.9,
    reviewCount: 42,
    isFeatured: true,
    isNew: false,
    tags: ["sofa", "premium", "scandinavian", "handcrafted"],
    sku: "FRN-LIV-002",
  },
  {
    _id: "prod_010",
    name: "Executive Desk",
    description:
      "Large executive desk with built-in cable management. Solid walnut construction with a matte finish.",
    price: 120000,
    originalPrice: null,
    discount: 0,
    category: "Office",
    image: rect36,
    images: [rect36],
    stock: 7,
    rating: 4.6,
    reviewCount: 11,
    isFeatured: true,
    isNew: false,
    tags: ["desk", "office", "walnut"],
    sku: "FRN-OFF-001",
  },
  {
    _id: "prod_011",
    name: "Ergonomic Chair",
    description:
      "High-back ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh back.",
    price: 85000,
    originalPrice: 100000,
    discount: 15,
    category: "Office",
    image: rect37,
    images: [rect37],
    stock: 12,
    rating: 4.4,
    reviewCount: 28,
    isFeatured: false,
    isNew: true,
    tags: ["chair", "office", "ergonomic"],
    sku: "FRN-OFF-002",
  },
  {
    _id: "prod_012",
    name: "Bella Dining Set",
    description:
      "6-seater dining table set with premium teak wood. Includes matching chairs with cushioned seats.",
    price: 180000,
    originalPrice: 220000,
    discount: 18,
    category: "Dining",
    image: rect38,
    images: [rect38],
    stock: 4,
    rating: 4.7,
    reviewCount: 16,
    isFeatured: true,
    isNew: false,
    tags: ["dining", "table", "teak", "set"],
    sku: "FRN-DIN-004",
  },
  {
    _id: "prod_013",
    name: "Cloud King Bed",
    description:
      "King-size platform bed with padded headboard and under-bed storage. Premium velvet upholstery.",
    price: 220000,
    originalPrice: 280000,
    discount: 21,
    category: "Bedroom",
    image: rect39,
    images: [rect39],
    stock: 6,
    rating: 4.8,
    reviewCount: 33,
    isFeatured: true,
    isNew: false,
    tags: ["bed", "king", "velvet", "storage"],
    sku: "FRN-BED-003",
  },
  {
    _id: "prod_014",
    name: "Zen Bookshelf",
    description:
      "Open-style bookshelf with asymmetric shelves. Perfect for displaying books, plants, and décor.",
    price: 65000,
    originalPrice: null,
    discount: 0,
    category: "Living Room",
    image: rect40,
    images: [rect40],
    stock: 18,
    rating: 4.3,
    reviewCount: 9,
    isFeatured: false,
    isNew: true,
    tags: ["bookshelf", "living room", "modern"],
    sku: "FRN-LIV-003",
  },
  {
    _id: "prod_015",
    name: "Patio Lounge Set",
    description:
      "4-piece outdoor lounge set with weather-resistant rattan weave and UV-protected cushions.",
    price: 150000,
    originalPrice: 200000,
    discount: 25,
    category: "Outdoor",
    image: rect41,
    images: [rect41],
    stock: 5,
    rating: 4.5,
    reviewCount: 14,
    isFeatured: false,
    isNew: false,
    tags: ["outdoor", "lounge", "patio", "rattan"],
    sku: "FRN-OUT-003",
  },
  {
    _id: "prod_016",
    name: "Nordic Side Table",
    description:
      "Compact side table with Scandinavian design. Solid birch wood with natural grain finish.",
    price: 32000,
    originalPrice: null,
    discount: 0,
    category: "Living Room",
    image: rect43,
    images: [rect43],
    stock: 25,
    rating: 4.2,
    reviewCount: 7,
    isFeatured: false,
    isNew: true,
    tags: ["table", "side table", "nordic", "birch"],
    sku: "FRN-LIV-004",
  },
];

// ── Helper Functions ──────────────────────────────────────────────

export const formatPrice = (price) => {
  return `₹${new Intl.NumberFormat("en-IN").format(price)}`;
};

export const formatPriceNumber = (price) => {
  return price;
};

export const getAllProducts = () => products;

export const getProductById = (id) => products.find((p) => p._id === id);

export const getProductsByCategory = (category) => {
  if (!category || category === "All") return products;
  return products.filter((p) => p.category === category);
};

export const getFeaturedProducts = () =>
  products.filter((p) => p.isFeatured);

export const getNewProducts = () => products.filter((p) => p.isNew);

export const searchProducts = (query) => {
  if (!query) return products;
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
};

export const getRelatedProducts = (productId, limit = 4) => {
  const product = getProductById(productId);
  if (!product) return products.slice(0, limit);
  return products
    .filter((p) => p._id !== productId && p.category === product.category)
    .slice(0, limit);
};

export const getCategories = () => {
  return [...new Set(products.map((p) => p.category))];
};

export default products;
