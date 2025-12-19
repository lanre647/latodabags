import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../services/axios';
import { addItem } from '../slices/cartSlice';
import CustomForm from '../components/CustomForm';

export default function Customize() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        console.log('Product API response:', response.data);
        setProduct(response.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleSubmit = (customOptions) => {
    console.log('Adding to cart:', {
      name: product.name,
      basePrice: product.basePrice,
      price: product.basePrice,
      quantity: 1,
    });
    dispatch(
      addItem({
        ...product,
        price: Number(product.basePrice) || 0,
        customOptions,
        quantity: 1,
      })
    );
    navigate('/cart');
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!product)
    return <div className="text-center py-10">Product not found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(`/product/${id}`)}
        className="text-indigo-600 mb-4"
      >
        ← Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Customize: {product.name}</h1>
      <CustomForm product={product} onSubmit={handleSubmit} />
    </div>
  );
}
