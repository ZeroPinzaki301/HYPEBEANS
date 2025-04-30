import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { Link } from "react-router-dom";

const AdminInventory = () => {
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch ingredient list on page load
  const fetchIngredients = async () => {
    try {
      const { data } = await axiosInstance.get("/api/inventory/ingredients");
      setIngredients(data);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching ingredients.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleRestock = async (ingredientId) => {
    const quantityStr = prompt("Enter quantity to restock:");
    const quantity = parseFloat(quantityStr);

    if (isNaN(quantity) || quantity <= 0) {
      alert("Invalid quantity entered.");
      return;
    }

    try {
      await axiosInstance.put(`/api/inventory/ingredients/${ingredientId}`, { quantity });
      alert("Ingredient restocked successfully!");
      fetchIngredients(); // Refresh inventory list
    } catch (err) {
      console.error(err);
      alert("Failed to restock ingredient.");
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

      <h1 className="text-center text-4xl font-bold mb-8">Ingredient Inventory</h1>

      {error && (
        <p className="text-red-500 bg-red-100 p-4 rounded-lg text-center mb-4">{error}</p>
      )}

      {isLoading ? (
        <p className="text-gray-500 text-center">Loading inventory...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2 text-left">Ingredient Name</th>
                <th className="border px-4 py-2 text-left">Quantity</th>
                <th className="border px-4 py-2 text-left">Unit</th>
                <th className="border px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.length > 0 ? (
                ingredients.map((ingredient) => (
                  <tr key={ingredient._id}>
                    <td className="border px-4 py-2">{ingredient.name}</td>
                    <td className="border px-4 py-2">{ingredient.quantity}</td>
                    <td className="border px-4 py-2">{ingredient.unit}</td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => handleRestock(ingredient._id)}
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
                    No ingredients available.
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
