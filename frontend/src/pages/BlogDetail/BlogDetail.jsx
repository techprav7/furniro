import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Calendar, Tag } from "lucide-react";
import Location from "../../components/Location";
import Quality_assurance from "../../components/Quality_assurance";
import api from "../../utils/api";

const BlogDetail = () => {
  const { id } = useParams();
  
  const [post, setPost] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api(`/api/blogs/${id}`);
        if (data.success) {
          setPost(data.blog);
        } else {
          setError(data.message || "Failed to find the blog post");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading the blog post.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [id]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const catRes = await api("/api/blogs/categories");
        if (catRes.success) setCategories(catRes.categories || []);

        const recentRes = await api("/api/blogs/recent");
        if (recentRes.success) setRecentPosts(recentRes.blogs || []);
      } catch (err) {
        console.error("Failed to load blog details metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading blog post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col">
        <h2 className="text-2xl font-bold mb-4">Post not found</h2>
        <Link to="/blog" className="text-[#B88E2F] hover:underline flex items-center gap-2 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Location title="Blog Post" breadcrumb="Blog Detail" />
      <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
        
        {/* Main Content */}
        <main className="lg:w-2/3 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-150">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          <img
            src={post.image}
            alt={post.title}
            className="w-full h-[300px] md:h-[450px] object-cover rounded-lg mb-6 shadow-sm"
          />

          <div className="flex flex-wrap items-center text-gray-500 text-sm gap-4 mb-6">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4 text-[#B88E2F]" /> By {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-[#B88E2F]" /> {new Date(post.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
              })}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4 text-[#B88E2F]" /> {post.category}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          <div
            className="prose max-w-none text-gray-700 leading-relaxed space-y-4 text-base"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </main>

        {/* Sidebar */}
        <aside className="lg:w-1/3 flex flex-col gap-8">
          {/* Categories */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Categories
            </h3>
            <ul className="divide-y divide-gray-100 pl-0 mb-0">
              {categories.map((cat) => (
                <li key={cat.name} className="py-3 flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium">{cat.name}</span>
                  <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {cat.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Posts */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Recent Posts
            </h3>
            <div className="flex flex-col gap-4">
              {recentPosts.map((rPost) => (
                <Link
                  key={rPost._id}
                  to={`/blog/${rPost._id}`}
                  className="flex gap-4 items-center group no-underline"
                >
                  <img
                    src={rPost.image}
                    alt={rPost.title}
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#B88E2F] line-clamp-2 transition leading-snug mb-0">
                      {rPost.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <Quality_assurance />
    </div>
  );
};

export default BlogDetail;
