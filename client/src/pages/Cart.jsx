import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { removeItem, updateQuantity } from '../slices/cartSlice';

export default function Cart() {
  const dispatch = useDispatch();
  const { items, total } = useSelector((s) => s.cart);

  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600 mb-4">Your cart is empty</p>
        <Link to="/" className="text-indigo-600 hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item._id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-600">
                ₦{(item.price || item.basePrice || 0).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  dispatch(
                    updateQuantity({
                      id: item._id,
                      quantity: parseInt(e.target.value),
                    })
                  )
                }
                className="w-12 border rounded p-1"
              />
              <button
                onClick={() => dispatch(removeItem(item._id))}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 border-t pt-4">
        <div className="text-xl font-bold mb-4">
          Total: ₦{total.toLocaleString()}
        </div>
        <Link
          to="/checkout"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-block"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
