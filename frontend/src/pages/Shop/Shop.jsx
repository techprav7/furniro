import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Location from '../../components/Location';
import Filter from './components/Filter';
import CardSection from './components/CardSection';
import Quality_assurance from '../../components/Quality_assurance';
import api from '../../utils/api';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial states from query parameters
  const urlCategory = searchParams.get('category') || 'All';
  const urlSearch = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [sortBy, setSortBy] = useState('Default');
  const [itemsPerPage, setItemsPerPage] = useState(16);
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api("/api/products/categories");
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Sync category state if URL parameter changes
  useEffect(() => {
    setSelectedCategory(urlCategory);
    setCurrentPage(1);
  }, [urlCategory]);

  // Sync search state if URL parameter changes
  useEffect(() => {
    setSearchQuery(urlSearch);
    setCurrentPage(1);
  }, [urlSearch]);

  // Sync state changes back to searchParams
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    
    const newParams = {};
    if (category !== 'All') newParams.category = category;
    if (searchQuery) newParams.search = searchQuery;
    setSearchParams(newParams);
  };

  // Fetch products from backend dynamically
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let sortParam = "-createdAt";
        if (sortBy === "price-low-high") sortParam = "price";
        else if (sortBy === "price-high-low") sortParam = "-price";
        else if (sortBy === "rating") sortParam = "-rating";
        else if (sortBy === "name") sortParam = "name";

        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          sort: sortParam,
        });

        if (selectedCategory && selectedCategory !== 'All') {
          params.append('category', selectedCategory);
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const data = await api(`/api/products?${params.toString()}`);
        setProducts(data.products || []);
        setTotalResults(data.pagination.total || 0);
        setTotalPages(data.pagination.pages || 1);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, currentPage, itemsPerPage]);

  return (
    <div>
      <Location title="Shop" />
      
      <Filter
        totalResults={totalResults}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        sortBy={sortBy}
        setSortBy={setSortBy}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleCategoryChange}
        currentPage={currentPage}
        categories={categories}
      />
      
      {loading ? (
        <div className="flex justify-center items-center py-24 bg-white">
          <p className="text-gray-500 font-semibold text-lg">Loading products...</p>
        </div>
      ) : (
        <CardSection
          products={products}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      )}
      
      <Quality_assurance />
    </div>
  );
};

export default Shop;
