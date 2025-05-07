import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { Link } from "react-router-dom";

const AdminInventory = () => {
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: 0,
    unit: "g"
  });
  const [addError, setAddError] = useState("");

  // Fetch ingredient list on page load
  const fetchIngredients = async () => {
    try {
      const { data } = await axiosInstance.get("/api/ingredients");
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
    const quantityStr = prompt("Enter quantity to add:");
    const quantityToAdd = parseFloat(quantityStr);

    if (isNaN(quantityToAdd)) {
      alert("Please enter a valid number.");
      return;
    }

    if (quantityToAdd <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    try {
      // First get current ingredient to show current quantity in prompt
      const currentIngredient = ingredients.find(ing => ing._id === ingredientId);
      const currentQuantity = currentIngredient?.quantity || 0;
      
      const confirmMessage = `Current quantity: ${currentQuantity} ${currentIngredient?.unit}\n` +
                           `Adding: ${quantityToAdd} ${currentIngredient?.unit}\n` +
                           `New total will be: ${currentQuantity + quantityToAdd} ${currentIngredient?.unit}\n\n` +
                           `Confirm restock?`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }

      await axiosInstance.put(`/api/ingredients/${ingredientId}`, { 
        $inc: { quantity: quantityToAdd } // Using $inc to add to existing quantity
      });
      
      alert("Ingredient restocked successfully!");
      fetchIngredients(); // Refresh inventory list
    } catch (err) {
      console.error(err);
      alert("Failed to restock ingredient.");
    }
  };

  const handleDelete = async (ingredientId, ingredientName) => {
    if (!window.confirm(`Are you sure you want to delete "${ingredientName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/ingredients/${ingredientId}`);
      alert("Ingredient deleted successfully!");
      fetchIngredients(); // Refresh the list
    } catch (err) {
      console.error(err);
      alert("Failed to delete ingredient. It may be used in products.");
    }
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    setAddError("");

    if (!newIngredient.name.trim()) {
      setAddError("Ingredient name is required");
      return;
    }

    if (newIngredient.quantity < 0) {
      setAddError("Quantity cannot be negative");
      return;
    }

    try {
      // First check if ingredient already exists
      const { data } = await axiosInstance.post("/api/ingredients/check", { 
        name: newIngredient.name 
      });

      if (data.exists) {
        setAddError("An ingredient with this name already exists");
        return;
      }

      // Create the new ingredient
      await axiosInstance.post("/api/ingredients/create", newIngredient);
      
      // Reset form and close modal
      setNewIngredient({
        name: "",
        quantity: 0,
        unit: "g"
      });
      setShowAddModal(false);
      
      // Refresh the list
      fetchIngredients();
    } catch (err) {
      console.error(err);
      setAddError(err.response?.data?.error || "Failed to add ingredient");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewIngredient(prev => ({
      ...prev,
      [name]: name === "quantity" ? parseFloat(value) || 0 : value
    }));
  };

  // Add Ingredient Modal
  const AddIngredientModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add New Ingredient</h2>
        
        {addError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {addError}
          </div>
        )}
        
        <form onSubmit={handleAddIngredient}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Ingredient Name*</label>
            <input
              type="text"
              name="name"
              value={newIngredient.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Initial Quantity</label>
            <input
              type="number"
              name="quantity"
              value={newIngredient.quantity}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Unit</label>
            <select
              name="unit"
              value={newIngredient.unit}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
            >
              <option value="g">g (grams)</option>
              <option value="ml">ml (milliliters)</option>
              <option value="pcs">pcs (pieces)</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Ingredient
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const getRowColor = (ingredient) => {
    const { quantity, unit } = ingredient;
    
    if (unit === "pcs") {
      if (quantity <= 20) return "bg-red-100";
      if (quantity <= 50) return "bg-yellow-100";
    } 
    else if (unit === "g") {
      if (quantity < 100) return "bg-red-100";
      if (quantity <= 200) return "bg-yellow-100";
    } 
    else if (unit === "ml") {
      if (quantity < 120) return "bg-red-100";
      if (quantity <= 250) return "bg-yellow-100";
    }
    
    return ""; // Default/no color
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

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg shadow-md transition duration-200 font-semibold"
        >
          Add New Ingredient
        </button>
      </div>

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
                <th className="border px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.length > 0 ? (
                ingredients.map((ingredient) => (
                  <tr key={ingredient._id} className={getRowColor(ingredient)}>
                    <td className="border px-4 py-2">{ingredient.name}</td>
                    <td className="border px-4 py-2">{ingredient.quantity}</td>
                    <td className="border px-4 py-2">{ingredient.unit}</td>
                    <td className="border px-4 py-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleRestock(ingredient._id)}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-sm shadow-md transition duration-200"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => handleDelete(ingredient._id, ingredient.name)}
                          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-sm shadow-md transition duration-200"
                        >
                          Delete
                        </button>
                      </div>
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

      {showAddModal && <AddIngredientModal />}
    </div>
  );
};

export default AdminInventory;
