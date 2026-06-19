import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

function App() {
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Fetch static metadata once
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const catRes = await api("/api/blogs/categories");
        if (catRes.success) {
          setCategories(catRes.categories || []);
        }
        const recentRes = await api("/api/blogs/recent");
        if (recentRes.success) {
          setRecentPosts(recentRes.blogs || []);
        }
      } catch (err) {
        console.error("Failed to load blog metadata:", err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch blogs based on active category / search query
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        let url = "/api/blogs?limit=50";
        if (activeCategory !== "All") {
          url += `&category=${encodeURIComponent(activeCategory)}`;
        }
        if (searchVal.trim()) {
          url += `&search=${encodeURIComponent(searchVal.trim())}`;
        }
        const data = await api(url);
        if (data.success) {
          setBlogs(data.blogs || []);
        }
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchBlogs();
    }, 300);

    return () => clearTimeout(timer);
  }, [activeCategory, searchVal]);

  const totalArticlesCount = categories.reduce((acc, cat) => acc + cat.count, 0);

  const Header = () => (
    <header className="py-4 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="relative">{/* logo / nav could go here */}</div>
      </div>
    </header>
  );

  const BlogPostCard = ({ post }) => (
    <article className="bg-white rounded-lg overflow-hidden shadow-sm mb-8 border border-gray-150">
      <img src={post.image} alt={post.title} className="w-full h-[300px] md:h-[400px] object-cover" />
      <div className="p-6">
        <div className="flex flex-wrap items-center text-gray-500 text-sm mb-3 gap-4">
          <span className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1 text-[#B88E2F]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {post.author}
          </span>
          <span className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1 text-[#B88E2F]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(post.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })}
          </span>
          <span className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1 text-[#B88E2F]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
            </svg>
            {post.category}
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-900 hover:text-[#B88E2F] transition-colors">
          <Link to={`/blog/${post._id}`} className="no-underline text-inherit">
            {post.title}
          </Link>
        </h2>
        <p className="text-gray-650 leading-relaxed mb-4 text-sm sm:text-base">{post.excerpt}</p>
        <Link 
          to={`/blog/${post._id}`} 
          className="text-black font-semibold hover:text-[#B88E2F] transition-colors no-underline border-b-2 border-black hover:border-[#B88E2F] pb-0.5"
        >
          Read more
        </Link>
      </div>
    </article>
  );

  const MainContent = () => (
    <main className="lg:w-2/3 lg:pr-8 mb-8 lg:mb-0">
      {loading ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-150">
          <p className="text-gray-500 font-medium">Loading articles...</p>
        </div>
      ) : blogs.length > 0 ? (
        blogs.map((post) => (
          <BlogPostCard key={post._id} post={post} />
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-150">
          <p className="text-gray-500 font-semibold">No blog posts found matching your filters.</p>
          <button 
            onClick={() => { setSearchVal(""); setActiveCategory("All"); }}
            className="mt-4 px-4 py-2 bg-[#B88E2F] text-white rounded hover:bg-[#a5761f] transition font-semibold"
          >
            Clear Filters
          </button>
        </div>
      )}
    </main>
  );

  const Sidebar = () => (
    <aside className="lg:w-1/3 lg:pl-8">
      {/* Search + Categories */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-150">
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search blog..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="border border-gray-300 rounded-md py-3 pl-4 pr-10 w-full focus:outline-none focus:ring-1 focus:ring-gray-300 text-base"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>

        <h3 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-100 pb-2">Categories</h3>
        <ul>
          <li className="flex justify-between items-center py-2.5">
            <button 
              onClick={() => setActiveCategory("All")}
              className={`hover:text-[#B88E2F] text-base font-semibold border-0 bg-transparent p-0 transition-colors ${
                activeCategory === "All" ? "text-[#B88E2F]" : "text-gray-700"
              }`}
            >
              All Articles
            </button>
            <span className="text-gray-400 text-sm font-semibold">{totalArticlesCount}</span>
          </li>
          {categories.map((category) => (
            <li key={category.name} className="flex justify-between items-center py-2.5">
              <button 
                onClick={() => setActiveCategory(category.name)}
                className={`hover:text-[#B88E2F] text-base font-semibold border-0 bg-transparent p-0 transition-colors ${
                  activeCategory === category.name ? "text-[#B88E2F]" : "text-gray-700"
                }`}
              >
                {category.name}
              </button>
              <span className="text-gray-400 text-sm font-semibold">{category.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-150">
        <h3 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-100 pb-2">Recent Posts</h3>
        <ul className="flex flex-col gap-4 pl-0">
          {recentPosts.map((post) => (
            <li key={post._id} className="flex items-center">
              <img src={post.image} alt={post.title} className="w-16 h-16 object-cover rounded-md mr-4 flex-shrink-0" />
              <Link 
                to={`/blog/${post._id}`} 
                className="text-gray-800 hover:text-[#B88E2F] font-semibold text-sm no-underline line-clamp-2 leading-snug transition"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );

  return (
    <div className="font-sans bg-gray-50 text-gray-800 min-h-screen">
      <Header />
      <div className="container mx-auto flex flex-col lg:flex-row mt-4 px-4 pb-12">
        <MainContent />
        <Sidebar />
      </div>
    </div>
  );
}

export default App;
