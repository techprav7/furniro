const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Blog = require("./models/Blog");
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

const blogPosts = [
  {
    title: "Going all-in with millennial design",
    excerpt: "Exploring how millennial design aesthetics are reshaping modern living rooms, prioritizing clean lines, warmth, and sustainable solid wood materials...",
    content: `<p>Millennial design is all about blending simplicity with high functionality. Modern homeowners are moving away from bulky, dark-themed furniture and embracing bright, airy layouts with organic textures. Light oak, linen fabrics, and warm neutral tones create a calming retreat away from busy schedules.</p>
      
<p>Sustainable sourcing and raw wood craftsmanship have become critical factors in decision making. People are opting for statement pieces that are built to last rather than quick, disposable items. Adding natural accents like indoor plants and handmade ceramics completes the contemporary aesthetic.</p>

<h3 class="text-2xl font-semibold my-4 text-gray-900">The Rise of Minimalist Aesthetics</h3>
<p>Minimalism isn't just about empty space; it's about making intentional choices. By selecting a few key pieces like an oak dining table or a modular fabric sofa, you can define a room's character without cluttering it. Quality takes center stage, highlighting the raw grain of wood and the comfort of the textiles.</p>`,
    image: "/images/blogs/blog1.jpg",
    category: "Wood",
    author: "Admin",
    tags: ["millennial", "design", "wood", "minimalist"],
    isPublished: true,
  },
  {
    title: "Exploring new ways of decorating",
    excerpt: "New decorating concepts focus on blurring the line between indoor comfort and outdoor freshness, utilizing handcrafted clay pots and wooden stands...",
    content: `<p>Blended interior spaces represent a shift toward tranquility and natural elements. Integrating plants, using natural stone textures, and selecting clay pots for greenery are easy ways to bring the freshness of nature into your urban apartment or workspace.</p>

<p>Choosing the right corner tables and open shelving units is essential to display these elements without overcrowding. Solid teak shelving or birch side tables complement green foliage beautifully, creating focal points that catch the eye and clear the mind.</p>

<h3 class="text-2xl font-semibold my-4 text-gray-900">Bringing Nature Indoors</h3>
<p>Indoor gardens are more than just a decoration; they improve air quality and bring life to empty corners. Position low-maintenance plants like snake plants or monstera next to light oak sideboards or velvet accent chairs to create a cohesive layout that feels natural and relaxed.</p>`,
    image: "/images/blogs/blog2.jpg",
    category: "Handmade",
    author: "Admin",
    tags: ["decorating", "nature", "handmade", "indoor"],
    isPublished: true,
  },
  {
    title: "Handmade pieces that took time to make",
    excerpt: "Discover the artistry behind custom wooden items that stand the test of time, and why hand-carved finishes are making a comeback in modern homes...",
    content: `<p>In a world of mass production, hand-carved, artisanal furniture stands out. Every notch, curve, and joint tells a story of patience and mastery, turning standard utility into functional art that elevates your daily routine.</p>

<p>Our workshop focuses on traditional mortise and tenon joinery, which guarantees structural integrity without relying on metal screws. From selecting raw walnut timber to the final coating of natural oils, we treat every item with individual care.</p>

<h3 class="text-2xl font-semibold my-4 text-gray-900">Crafting with Passion</h3>
<p>Investing in handcrafted pieces ensures that your furniture remains a cherished part of your family history. The rich, textured grain of real wood evolves gracefully over time, acquiring a unique patina that cannot be replicated by factory-line alternatives.</p>`,
    image: "/images/blogs/blog3.jpg",
    category: "Wood",
    author: "Admin",
    tags: ["handmade", "craftsmanship", "wood", "artisan"],
    isPublished: true,
  },
];

const seedBlogs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB for blog seeding");

    await Blog.deleteMany({});
    console.log("🗑️  Cleared existing blog posts");

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
        console.error("Failed to parse cloudinaryAssets.js in blog seed script:", err.message);
      }
    }

    if (hasCloudinary) {
      console.log("☁️  Uploading/mapping blog seed images to Cloudinary...");
      for (const post of blogPosts) {
        if (post.image && !post.image.startsWith("http")) {
          const fileName = path.basename(post.image);
          
          if (cloudinaryAssets[fileName]) {
            post.image = cloudinaryAssets[fileName];
            console.log(`Mapped blog "${post.title}" image using cloudinaryAssets: ${post.image}`);
          } else {
            const localImgPath = path.join(__dirname, "../frontend/public", post.image);
            if (fs.existsSync(localImgPath)) {
              try {
                const baseName = path.basename(post.image, path.extname(post.image));
                const uploadRes = await cloudinary.uploader.upload(localImgPath, {
                  folder: "furnio/blogs",
                  public_id: `${post.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${baseName}`,
                  overwrite: true,
                  invalidate: true,
                });
                post.image = uploadRes.secure_url;
                console.log(`Uploaded blog "${post.title}" image: ${uploadRes.secure_url}`);
              } catch (err) {
                console.error(`Failed to upload image for blog "${post.title}":`, err.message);
              }
            } else {
              // Try checking if it's in src/assets instead
              const fallbackPath = path.join(__dirname, "../frontend/src/assets", fileName);
              if (fs.existsSync(fallbackPath)) {
                try {
                  const baseName = path.basename(fileName, path.extname(fileName));
                  const uploadRes = await cloudinary.uploader.upload(fallbackPath, {
                    folder: "furnio/blogs",
                    public_id: `${post.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${baseName}`,
                    overwrite: true,
                    invalidate: true,
                  });
                  post.image = uploadRes.secure_url;
                  console.log(`Uploaded blog "${post.title}" image from fallback: ${uploadRes.secure_url}`);
                } catch (err) {
                  console.error(`Failed to upload fallback image for blog "${post.title}":`, err.message);
                }
              } else {
                console.warn(`Local blog image file not found and no Cloudinary map for "${post.title}": ${fileName}`);
              }
            }
          }
        }
      }
    } else {
      console.log("⚠️  Cloudinary not configured. Seeding blogs with local image paths.");
    }

    await Blog.insertMany(blogPosts);
    console.log(`🌱 Seeded ${blogPosts.length} blog posts`);

    await mongoose.connection.close();
    console.log("✅ Blog seeding complete. Connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Blog seeding failed:", error.message);
    process.exit(1);
  }
};

seedBlogs();
