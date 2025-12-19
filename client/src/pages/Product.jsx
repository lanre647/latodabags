import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/axios';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      console.error('No product ID provided');
      return;
    }

    const fetch = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!product)
    return <div className="text-center py-10">Product not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/')} className="text-indigo-600 mb-4">
        ← Back
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <img
          src={product.images?.[0] || product.image || '/placeholder.png'}
          alt={product.name}
          className="w-full rounded-lg"
        />
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <div className="text-2xl font-bold text-indigo-600 mb-4">
            ₦{(product.basePrice || product.price || 0).toLocaleString()}
          </div>
          <p className="text-sm text-gray-500 mb-6">📦 7-14d delivery</p>
          <button
            onClick={() => navigate(`/customize/${id}`)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-full"
          >
            Customize & Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
