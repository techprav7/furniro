const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

dotenv.config();

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const products = [
  {
    name: "Syltherine",
    description: "Stylish cafe chair with premium wood finish and comfortable seating. Perfect for modern dining spaces.",
    price: 25000,
    originalPrice: 35000,
    discount: 30,
    category: "Dining",
    image: "/images/products/image1.png",
    stock: 15,
    rating: 4.5,
    reviewCount: 0,
    isFeatured: true,
    isNewArrival: false,
    tags: ["chair", "dining", "wood"],
    sku: "FRN-DIN-001",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: false },
    ],
    colors: [
      { hex: "#8B4513", name: "Walnut", available: true },
      { hex: "#D2B48C", name: "Tan", available: true },
      { hex: "#000000", name: "Black", available: false },
    ],
  },
  {
    name: "Leviosa",
    description: "Elegant stylish cafe chair with ergonomic design. Built for comfort and style.",
    price: 25000,
    category: "Dining",
    image: "/images/products/image2.png",
    stock: 20,
    rating: 4.2,
    reviewCount: 0,
    isFeatured: true,
    isNewArrival: false,
    tags: ["chair", "cafe", "modern"],
    sku: "FRN-DIN-002",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
    ],
    colors: [
      { hex: "#FFFFFF", name: "White", available: true },
      { hex: "#C0C0C0", name: "Silver", available: true },
      { hex: "#808080", name: "Grey", available: true },
    ],
  },
  {
    name: "Lolito",
    description: "Luxury big sofa that redefines comfort. Premium upholstery with deep cushioning for ultimate relaxation.",
    price: 70000,
    originalPrice: 140000,
    discount: 50,
    category: "Living Room",
    image: "/images/products/image3.png",
    stock: 5,
    rating: 4.8,
    reviewCount: 0,
    isFeatured: true,
    isNewArrival: false,
    tags: ["sofa", "luxury", "living room"],
    sku: "FRN-LIV-001",
    sizes: [
      { label: "S", available: false },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
    ],
    colors: [
      { hex: "#816DFA", name: "Purple", available: true },
      { hex: "#2F4F4F", name: "Dark Slate", available: true },
      { hex: "#B88E2F", name: "Gold", available: false },
    ],
  },
  {
    name: "Respira",
    description: "Outdoor bar table and stool set. Weather-resistant materials with contemporary design.",
    price: 5000,
    category: "Outdoor",
    image: "/images/products/image4.png",
    stock: 30,
    rating: 4.0,
    reviewCount: 0,
    isFeatured: true,
    isNewArrival: true,
    tags: ["outdoor", "bar", "table"],
    sku: "FRN-OUT-001",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: false },
      { label: "XL", available: false },
    ],
    colors: [
      { hex: "#000000", name: "Black", available: true },
      { hex: "#8B4513", name: "Brown", available: true },
    ],
  },
  {
    name: "Grifo",
    description: "Night lamp with warm ambient lighting. Minimalist design that complements any bedroom aesthetic.",
    price: 15000,
    category: "Bedroom",
    image: "/images/products/image6.png",
    stock: 40,
    rating: 4.3,
    reviewCount: 0,
    isFeatured: false,
    isNewArrival: true,
    tags: ["lamp", "bedroom", "lighting"],
    sku: "FRN-BED-001",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: false },
    ],
    colors: [
      { hex: "#FFD700", name: "Gold", available: true },
      { hex: "#C0C0C0", name: "Silver", available: true },
      { hex: "#000000", name: "Matte Black", available: true },
    ],
  },
  {
    name: "Muggo",
    description: "Small mug with elegant ceramic finish. Perfect for coffee enthusiasts who appreciate design.",
    price: 1500,
    category: "Dining",
    image: "/images/products/image7.png",
    stock: 100,
    rating: 4.1,
    reviewCount: 0,
    isFeatured: false,
    isNewArrival: true,
    tags: ["mug", "kitchen", "ceramic"],
    sku: "FRN-DIN-003",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
    ],
    colors: [
      { hex: "#FFFFFF", name: "White", available: true },
      { hex: "#000000", name: "Black", available: true },
      { hex: "#2F4F4F", name: "Charcoal", available: false },
    ],
  },
  {
    name: "Pingky",
    description: "Cute bed set with premium cotton linen. Soft pastel tones for a cozy bedroom atmosphere.",
    price: 70000,
    originalPrice: 140000,
    discount: 50,
    category: "Bedroom",
    image: "/images/products/image8.png",
    stock: 8,
    rating: 4.7,
    reviewCount: 0,
    isFeatured: false,
    isNewArrival: false,
    tags: ["bed", "bedroom", "cotton"],
    sku: "FRN-BED-002",
    sizes: [
      { label: "Single", available: true },
      { label: "Double", available: true },
      { label: "Queen", available: true },
      { label: "King", available: false },
    ],
    colors: [
      { hex: "#FFB6C1", name: "Pink", available: true },
      { hex: "#E6E6FA", name: "Lavender", available: true },
      { hex: "#FFFDD0", name: "Cream", available: true },
    ],
  },
  {
    name: "Potty",
    description: "Minimalist flower pot crafted from premium terracotta. Adds a natural touch to any space.",
    price: 5000,
    category: "Outdoor",
    image: "/images/products/Image5.png",
    stock: 50,
    rating: 3.9,
    reviewCount: 0,
    isFeatured: false,
    isNewArrival: true,
    tags: ["pot", "outdoor", "garden"],
    sku: "FRN-OUT-002",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
    ],
    colors: [
      { hex: "#CD853F", name: "Terracotta", available: true },
      { hex: "#FFFFFF", name: "White", available: true },
      { hex: "#808080", name: "Grey", available: false },
    ],
  },
  {
    name: "Asgaard Sofa",
    description: "Premium handcrafted sofa with Scandinavian design. Features solid oak frame and premium fabric upholstery. The centerpiece of any modern living room.",
    price: 250000,
    originalPrice: 300000,
    discount: 17,
    category: "Living Room",
    image: "/images/products/Asgaardsofa3.png",
    stock: 3,
    rating: 4.9,
    reviewCount: 0,
    isFeatured: true,
    isNewArrival: false,
    tags: ["sofa", "premium", "scandinavian", "handcrafted"],
    sku: "FRN-LIV-002",
    sizes: [
      { label: "M", available: false },
      { label: "L", available: true },
      { label: "XL", available: true },
    ],
    colors: [
      { hex: "#F5F5DC", name: "Beige", available: true },
      { hex: "#808080", name: "Grey", available: true },
      { hex: "#2F4F4F", name: "Dark Slate", available: false },
      { hex: "#B88E2F", name: "Gold", available: true },
    ],
  },
  {
    name: "Executive Desk",
    description: "Large executive desk with built-in cable management. Solid walnut construction with a matte finish.",
    price: 120000,
    category: "Office",
    image: "/images/products/Rectangle36.png",
    stock: 7,
    rating: 4.6,
    reviewCount: 0,
    isFeatured: true,
    isNewArrival: false,
    tags: ["desk", "office", "walnut"],
    sku: "FRN-OFF-001",
    sizes: [
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
    ],
    colors: [
      { hex: "#8B4513", name: "Walnut", available: true },
      { hex: "#000000", name: "Black", available: true },
      { hex: "#FFFFFF", name: "White Oak", available: false },
    ],
  },
  {
    name: "Ergonomic Chair",
    description: "High-back ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh back.",
    price: 85000,
    originalPrice: 100000,
    discount: 15,
    category: "Office",
    image: "/images/products/Rectangle37.png",
    stock: 12,
    rating: 4.4,
    reviewCount: 0,
    isFeatured: false,
    isNewArrival: true,
    tags: ["chair", "office", "ergonomic"],
    sku: "FRN-OFF-002",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: true },
    ],
    colors: [
      { hex: "#000000", name: "Black", available: true },
      { hex: "#808080", name: "Grey", available: true },
      { hex: "#1E90FF", name: "Blue", available: false },
    ],
  },
  {
    name: "Bella Dining Set",
    description: "6-seater dining table set with premium teak wood. Includes matching chairs with cushioned seats.",
    price: 180000,
    originalPrice: 220000,
    discount: 18,
    category: "Dining",
    image: "/images/products/Rectangle38.png",
    stock: 4,
    rating: 4.7,
    reviewCount: 0,
    isFeatured: true,
    isNewArrival: false,
    tags: ["dining", "table", "teak", "set"],
    sku: "FRN-DIN-004",
    sizes: [
      { label: "M", available: false },
      { label: "L", available: true },
      { label: "XL", available: true },
    ],
    colors: [
      { hex: "#D2691E", name: "Teak", available: true },
      { hex: "#8B4513", name: "Dark Walnut", available: true },
    ],
  },
  {
    name: "Cloud King Bed",
    description: "King-size platform bed with padded headboard and under-bed storage. Premium velvet upholstery.",
    price: 220000,
    originalPrice: 280000,
    discount: 21,
    category: "Bedroom",
    image: "/images/products/Rectangle39.png",
    stock: 6,
    rating: 4.8,
    reviewCount: 0,
    isFeatured: true,
    isNewArrival: false,
    tags: ["bed", "king", "velvet", "storage"],
    sku: "FRN-BED-003",
    sizes: [
      { label: "Single", available: false },
      { label: "Double", available: false },
      { label: "Queen", available: true },
      { label: "King", available: true },
    ],
    colors: [
      { hex: "#4B0082", name: "Indigo Velvet", available: true },
      { hex: "#808080", name: "Grey", available: true },
      { hex: "#F5F5DC", name: "Beige", available: true },
      { hex: "#2F4F4F", name: "Charcoal", available: false },
    ],
  },
  {
    name: "Zen Bookshelf",
    description: "Open-style bookshelf with asymmetric shelves. Perfect for displaying books, plants, and décor.",
    price: 65000,
    category: "Living Room",
    image: "/images/products/Rectangle40.png",
    stock: 18,
    rating: 4.3,
    reviewCount: 0,
    isFeatured: false,
    isNewArrival: true,
    tags: ["bookshelf", "living room", "modern"],
    sku: "FRN-LIV-003",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
      { label: "L", available: true },
    ],
    colors: [
      { hex: "#DEB887", name: "Natural Oak", available: true },
      { hex: "#000000", name: "Black", available: true },
      { hex: "#FFFFFF", name: "White", available: false },
    ],
  },
  {
    name: "Patio Lounge Set",
    description: "4-piece outdoor lounge set with weather-resistant rattan weave and UV-protected cushions.",
    price: 150000,
    originalPrice: 200000,
    discount: 25,
    category: "Outdoor",
    image: "/images/products/Rectangle41.png",
    stock: 5,
    rating: 4.5,
    reviewCount: 0,
    isFeatured: false,
    isNewArrival: false,
    tags: ["outdoor", "lounge", "patio", "rattan"],
    sku: "FRN-OUT-003",
    sizes: [
      { label: "M", available: true },
      { label: "L", available: true },
      { label: "XL", available: false },
    ],
    colors: [
      { hex: "#8B4513", name: "Natural Rattan", available: true },
      { hex: "#808080", name: "Grey", available: true },
      { hex: "#000000", name: "Black", available: true },
    ],
  },
  {
    name: "Nordic Side Table",
    description: "Compact side table with Scandinavian design. Solid birch wood with natural grain finish.",
    price: 32000,
    category: "Living Room",
    image: "/images/products/Rectangle43.png",
    stock: 25,
    rating: 4.2,
    reviewCount: 0,
    isFeatured: false,
    isNewArrival: true,
    tags: ["table", "side table", "nordic", "birch"],
    sku: "FRN-LIV-004",
    sizes: [
      { label: "S", available: true },
      { label: "M", available: true },
    ],
    colors: [
      { hex: "#DEB887", name: "Birch", available: true },
      { hex: "#FFFFFF", name: "White", available: true },
      { hex: "#000000", name: "Black", available: false },
    ],
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB for seeding");

    await Product.deleteMany({});
    console.log("🗑️  Cleared existing products");

    // Check if Cloudinary is configured and upload images
    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    // Load cloudinaryAssets mapping if available
    let cloudinaryAssets = {};
    const mapFilePath = path.join(__dirname, "../frontend/src/cloudinaryAssets.js");
    if (fs.existsSync(mapFilePath)) {
      try {
        const fileContent = fs.readFileSync(mapFilePath, "utf8");
        const startIdx = fileContent.indexOf("{");
        const endIdx = fileContent.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1) {
          cloudinaryAssets = JSON.parse(fileContent.substring(startIdx, endIdx + 1));
          console.log(`Loaded ${Object.keys(cloudinaryAssets).length} mapped assets from cloudinaryAssets.js`);
        }
      } catch (err) {
        console.error("Failed to parse cloudinaryAssets.js in seed script:", err.message);
      }
    }

    if (hasCloudinary) {
      console.log("☁️  Uploading/mapping seed images to Cloudinary...");
      for (const p of products) {
        if (p.image && !p.image.startsWith("http")) {
          const fileName = path.basename(p.image);
          
          if (cloudinaryAssets[fileName]) {
            p.image = cloudinaryAssets[fileName];
            console.log(`Mapped ${p.name} image using cloudinaryAssets: ${p.image}`);
          } else {
            const localImgPath = path.join(__dirname, "../frontend/src/assets", fileName);
            if (fs.existsSync(localImgPath)) {
              try {
                const baseName = path.basename(fileName, path.extname(fileName));
                const uploadRes = await cloudinary.uploader.upload(localImgPath, {
                  folder: "furnio/products",
                  public_id: `${p.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${baseName}`,
                  overwrite: true,
                  invalidate: true,
                });
                p.image = uploadRes.secure_url;
                console.log(`Uploaded ${p.name} image: ${uploadRes.secure_url}`);
              } catch (err) {
                console.error(`Failed to upload image for ${p.name}:`, err.message);
              }
            } else {
              console.warn(`Local file not found and no Cloudinary map for ${p.name}: ${localImgPath}`);
            }
          }
        }

        if (p.images && p.images.length > 0) {
          const uploadedImages = [];
          for (let i = 0; i < p.images.length; i++) {
            const imgPath = p.images[i];
            if (imgPath && !imgPath.startsWith("http")) {
              const fileName = path.basename(imgPath);
              
              if (cloudinaryAssets[fileName]) {
                uploadedImages.push(cloudinaryAssets[fileName]);
                console.log(`Mapped ${p.name} gallery image ${i} using cloudinaryAssets: ${cloudinaryAssets[fileName]}`);
              } else {
                const localImgPath = path.join(__dirname, "../frontend/src/assets", fileName);
                if (fs.existsSync(localImgPath)) {
                  try {
                    const baseName = path.basename(fileName, path.extname(fileName));
                    const uploadRes = await cloudinary.uploader.upload(localImgPath, {
                      folder: "furnio/products",
                      public_id: `${p.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_gallery_${i}_${baseName}`,
                      overwrite: true,
                      invalidate: true,
                    });
                    uploadedImages.push(uploadRes.secure_url);
                  } catch (err) {
                    console.error(`Failed to upload gallery image ${i} for ${p.name}:`, err.message);
                    uploadedImages.push(imgPath);
                  }
                } else {
                  console.warn(`Local gallery file not found and no Cloudinary map for ${p.name}: ${localImgPath}`);
                  uploadedImages.push(imgPath);
                }
              }
            } else {
              uploadedImages.push(imgPath);
            }
          }
          p.images = uploadedImages;
        }
      }
    } else {
      console.log("⚠️  Cloudinary not configured. Seeding with local image paths.");
    }

    await Product.insertMany(products);
    console.log(`🌱 Seeded ${products.length} products`);

    await mongoose.connection.close();
    console.log("✅ Seeding complete. Connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDB();
