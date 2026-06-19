const Blog = require("../models/Blog");

// GET /api/blogs — List published blogs with pagination, search, category
exports.getBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sort = "-createdAt",
    } = req.query;

    const filter = { isPublished: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      blogs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("GetBlogs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/blogs/categories — Get distinct categories with counts
exports.getCategories = async (req, res) => {
  try {
    const categories = await Blog.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { name: "$_id", count: 1, _id: 0 } },
      { $sort: { name: 1 } },
    ]);

    res.json({ success: true, categories });
  } catch (error) {
    console.error("GetBlogCategories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/blogs/recent — Get recent posts (latest 5)
exports.getRecentBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title image createdAt")
      .lean();

    res.json({ success: true, blogs });
  } catch (error) {
    console.error("GetRecentBlogs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/blogs/:id — Single blog post
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).lean();
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }
    res.json({ success: true, blog });
  } catch (error) {
    console.error("GetBlog error:", error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid blog ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/blogs — Create blog (Admin)
exports.createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, image, category, author, tags, isPublished } = req.body;

    const newBlog = new Blog({
      title,
      excerpt,
      content,
      image,
      category,
      author: author || "Admin",
      tags: tags || [],
      isPublished: isPublished !== false,
    });

    await newBlog.save();
    res.status(201).json({ success: true, blog: newBlog });
  } catch (error) {
    console.error("CreateBlog error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/blogs/:id — Update blog (Admin)
exports.updateBlog = async (req, res) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.json({ success: true, blog: updatedBlog });
  } catch (error) {
    console.error("UpdateBlog error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/blogs/:id — Delete blog (Admin)
exports.deleteBlog = async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog post not found" });
    }
    res.json({ success: true, message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("DeleteBlog error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
