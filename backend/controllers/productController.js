const Product = require("../models/Product");

// GET /api/products — list with pagination, search, category filter
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 16,
      category,
      search,
      sort = "-createdAt",
      featured,
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("GetProducts error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/products/:id — single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ product });
  } catch (error) {
    console.error("GetProduct error:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/products/categories — list all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json({ categories });
  } catch (error) {
    console.error("GetCategories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/products — create a new product (Admin)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, discount, category, image, images, stock, tags, sku } = req.body;
    
    if (sku) {
      const existing = await Product.findOne({ sku });
      if (existing) {
        return res.status(400).json({ message: `Product with SKU ${sku} already exists` });
      }
    }

    const newProduct = new Product({
      name,
      description,
      price,
      originalPrice,
      discount: discount || 0,
      category,
      image,
      images: images || [image],
      stock: stock || 0,
      tags: tags || [],
      sku
    });

    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error("CreateProduct error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/products/:id — update a product (Admin)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("UpdateProduct error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/products/:id — delete a product (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("DeleteProduct error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

