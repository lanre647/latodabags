import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

export default function CustomForm({ product, onSubmit }) {
  const [loading, setLoading] = useState(false);

  const initialValues = {};
  const validationSchema = {};

  (product?.customOptions || []).forEach((opt) => {
    initialValues[opt.name] = opt.default || '';
    if (opt.required) {
      validationSchema[opt.name] = Yup.string().required(
        `${opt.label || opt.name} is required`
      );
    }
  });

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape(validationSchema),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await onSubmit(values);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4 max-w-2xl">
      {(product?.customOptions || []).map((opt) => (
        <div key={opt.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {opt.label || opt.name}
            {opt.required && <span className="text-red-500">*</span>}
          </label>
          {opt.type === 'select' ? (
            <select
              name={opt.name}
              value={formik.values[opt.name]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select {opt.label || opt.name}</option>
              {(opt.options || []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : opt.type === 'textarea' ? (
            <textarea
              name={opt.name}
              value={formik.values[opt.name]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows="4"
            />
          ) : (
            <input
              type={opt.type || 'text'}
              name={opt.name}
              value={formik.values[opt.name]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          )}
          {formik.touched[opt.name] && formik.errors[opt.name] && (
            <div className="mt-1 text-sm text-red-600">
              {formik.errors[opt.name]}
            </div>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition"
      >
        {loading ? 'Submitting...' : 'Continue'}
      </button>
    </form>
  );
}
