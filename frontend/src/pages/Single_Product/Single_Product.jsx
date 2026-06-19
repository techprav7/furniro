import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Location from './components/Location';
import Product from './components/Product';
import Description from './components/Description';
import Otherprods from './components/Otherprods';
import api from '../../utils/api';

const Single_Product = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scroll to top when product ID changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Fetch product by ID dynamically
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await api(`/api/products/${id}`);
        setProduct(data.product);
      } catch (err) {
        console.error("Error fetching product details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <p className="text-gray-500 font-semibold">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    // Redirect to shop if product not found
    return <Navigate to="/shop" replace />;
  }

  return (
    <div>
      <Location product={product} />
      <Product product={product} />
      <Description product={product} />
      <Otherprods product={product} />
    </div>
  );
};

export default Single_Product;