import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { Link } from "react-router-dom";

const AdminInventory = () => {
  const [products, setProducts] = useState([]); // Store product details
  const [error, setError] = useState(""); // Handle errors
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Fetch product list on page load
  const fetchProducts = async () => {
    try {
      const { data } = await axiosInstance.get("/api/products");
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching products.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRestock = async (productId) => {
    const quantityStr = prompt("Enter quantity to restock:");
    const quantity = parseInt(quantityStr, 10);

    if (isNaN(quantity) || quantity <= 0) {
      alert("Invalid quantity entered.");
      return;
    }

    try {
      await axiosInstance.put(`/api/products/restock/${productId}`, { quantity });
      alert("Product restocked successfully!");
      fetchProducts(); // refresh product list
    } catch (err) {
      console.error(err);
      alert("Failed to restock product.");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6 font-serif">
      <Link
        to="/admin-dashboard"
        className="absolute top-4 left-4 bg-zinc-800 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-200 font-semibold"
      >
        Back to Dashboard
      </Link>

      <h1 className="text-center text-4xl font-bold mb-8">Inventory Management</h1>

      {error && (
        <p className="text-red-500 bg-red-100 p-4 rounded-lg text-center mb-4">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-gray-500 text-center">Loading inventory...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2 text-left">Product Name</th>
                <th className="border px-4 py-2 text-left">Price</th>
                <th className="border px-4 py-2 text-left">Stock</th>
                <th className="border px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr
                    key={product._id}
                    className={`${
                      product.stock < 5
                        ? "bg-red-100"
                        : product.stock < 10
                        ? "bg-yellow-100"
                        : ""
                    }`}
                  >
                    <td className="border px-4 py-2">{product.name}</td>
                    <td className="border px-4 py-2">₱{product.price.toFixed(2)}</td>
                    <td className="border px-4 py-2">{product.stock}</td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => handleRestock(product._id)}
                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-sm shadow-md transition duration-200"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="border px-4 py-2 text-center text-gray-500">
                    No products available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
