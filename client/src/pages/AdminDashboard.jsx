import React, { useEffect, useState } from 'react';
import api from '../services/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/orders/admin/all');
        const ordersList = Array.isArray(data) ? data : data?.orders || [];
        setOrders(ordersList);
      } catch (err) {
        console.error('Fetch error:', err);
        setOrders([]); // Ensure orders is always an array
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <p className="text-gray-600">Total Orders</p>
          <p className="text-3xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <p className="text-gray-600">Pending</p>
          <p className="text-3xl font-bold">
            {orders.filter((o) => o.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <p className="text-gray-600">Completed</p>
          <p className="text-3xl font-bold">
            {orders.filter((o) => o.status === 'completed').length}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">All Orders</h2>
      <div className="bg-white rounded-lg overflow-hidden shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Order ID</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{order._id.slice(-8)}</td>
                <td className="px-4 py-2">₦{order.total?.toLocaleString()}</td>
                <td className="px-4 py-2 capitalize">{order.status}</td>
                <td className="px-4 py-2">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
