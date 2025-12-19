import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const imageUrl = product.images?.[0] || product.image || '/placeholder.png';
  const price = product.basePrice || product.price || 0;
  // Use id field (virtual that exposes MongoDB _id)
  const productId = product.id;

  if (!productId) {
    console.warn('Product missing ID:', product.name, product);
    return (
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm p-4 text-red-600">
        Error: Product ID missing for {product.name}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition">
      <Link to={`/product/${productId}`}>
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <h3 className="font-semibold text-gray-900">{product.name}</h3>
          <div className="mt-2 text-xs text-gray-500 font-medium">
            📦 7-14d delivery
          </div>
          <div className="mt-3 font-bold text-lg text-indigo-600">
            ₦{price.toLocaleString()}
          </div>
        </div>
      </Link>
    </div>
  );
}
