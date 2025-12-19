import React, { useEffect, useState } from 'react';
import api from '../services/axios';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        const data = response.data;

        // API returns { success: true, data: products[] }
        const productsList = data?.data || [];
        setProducts(Array.isArray(productsList) ? productsList : []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error)
    return <div className="text-red-600 text-center py-10">Error: {error}</div>;
  if (!products || products.length === 0)
    return (
      <div className="text-center py-10 text-gray-600">
        No products available
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Handmade Bags</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
