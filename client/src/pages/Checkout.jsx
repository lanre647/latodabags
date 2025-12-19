import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/axios';
import { clearCart } from '../slices/cartSlice';

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((s) => s.cart);
  const auth = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(false);

  console.log('Checkout page - cart state:', { items, total });

  const [formData, setFormData] = useState({
    address: '',
    phone: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        items,
        shippingAddress: formData.address,
        phone: formData.phone,
        total,
      };
      const { data } = await api.post('/orders/custom', payload);
      dispatch(clearCart());
      navigate(`/orders`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Shipping Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-indigo-500"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-indigo-500"
          />
        </div>
        <div className="border-t pt-4">
          <div className="text-xl font-bold mb-4">
            Total: ₦{total.toLocaleString()}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Complete Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
