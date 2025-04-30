import React, { useState, useEffect } from "react";
import axios from "../utils/axiosInstance";

const ProductModal = ({ closeModal, saveProduct, editingProduct }) => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    productType: "beverages",
    beverageType: "",
    imageFile: null,
    ingredients: [],
  });

  // State for the ingredient selection
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all available ingredients when the modal opens
  useEffect(() => {
    const fetchIngredients = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get("/api/ingredients");
        setAvailableIngredients(data);
      } catch (err) {
        console.error("Error fetching ingredients:", err);
        setError("Failed to load ingredients. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  useEffect(() => {
    if (editingProduct) {
      // Make sure ingredients are properly formatted
      const formattedIngredients = editingProduct.ingredients.map(ing => ({
        ingredient: ing.ingredient._id || ing.ingredient,
        quantityRequired: ing.quantityRequired,
        // Store name for display purposes only (not sent to backend)
        name: ing.ingredient?.name || 'Unknown Ingredient',
        unit: ing.ingredient?.unit || 'g'
      }));

      setProduct({
        ...editingProduct,
        imageFile: null,
        ingredients: formattedIngredients
      });
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "productType" && value === "delights" ? { beverageType: "" } : {}),
    }));
  };

  const handleFileChange = (e) => {
    setProduct((prev) => ({ ...prev, imageFile: e.target.files[0] }));
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient || !ingredientQuantity) {
      setError("Please select an ingredient and specify quantity");
      return;
    }
  
    // Check if ingredient already exists
    const isAlreadyAdded = product.ingredients.some(ing => ing.ingredient === selectedIngredient);
    if (isAlreadyAdded) {
      setError("This ingredient is already added to the product");
      return;
    }
  
    // Add only the ingredient ID and required quantity
    setProduct((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { ingredient: selectedIngredient, quantityRequired: Number(ingredientQuantity) }
      ],
    }));
  
    // Clear selections
    setSelectedIngredient("");
    setIngredientQuantity("");
    setError(null);
  };

  const removeIngredient = (index) => {
    setProduct(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!product.name || !product.price || !product.description || !product.productType) {
      setError("Please fill out all required fields.");
      setIsSubmitting(false);
      return;
    }

    if (product.productType === "beverages" && !product.beverageType) {
      setError("Please select a beverage type.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare product data for backend - ensure ingredients are properly formatted
      const productToSave = {
        ...product,
        // Format ingredients correctly for backend
        ingredients: product.ingredients.map(ing => ({
          ingredient: ing.ingredient, // Just the ID
          quantityRequired: ing.quantityRequired
        }))
      };

      await saveProduct(productToSave, product.imageFile);
      closeModal();
    } catch (err) {
      console.error("Error saving product:", err);
      setError(err.message || "Failed to save product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {editingProduct ? "Edit Product" : "Add Product"}
        </h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name*</label>
              <input 
                type="text" 
                name="name" 
                placeholder="Product Name" 
                value={product.name} 
                onChange={handleChange} 
                className="w-full p-2 border rounded-lg" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price*</label>
              <input 
                type="number" 
                name="price" 
                placeholder="Price" 
                value={product.price} 
                onChange={handleChange} 
                className="w-full p-2 border rounded-lg" 
                min="0"
                step="0.01"
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
              <textarea 
                name="description" 
                placeholder="Description" 
                value={product.description} 
                onChange={handleChange} 
                className="w-full p-2 border rounded-lg" 
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Type*</label>
              <select 
                name="productType" 
                value={product.productType} 
                onChange={handleChange} 
                className="w-full p-2 border rounded-lg" 
                required
              >
                <option value="beverages">Beverages</option>
                <option value="delights">Delights</option>
              </select>
            </div>

            {product.productType === "beverages" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beverage Type*</label>
                <select 
                  name="beverageType" 
                  value={product.beverageType} 
                  onChange={handleChange} 
                  className="w-full p-2 border rounded-lg" 
                  required
                >
                  <option value="">Select Beverage Type</option>
                  <option value="espresso based">Espresso Based</option>
                  <option value="coffee based frappe">Coffee Based Frappe</option>
                  <option value="non-coffee based">Non-Coffee Based</option>
                  <option value="non-coffee based frappe">Non-Coffee Based Frappe</option>
                  <option value="refreshments">Refreshments</option>
                  <option value="cold brew specials">Cold Brew Specials</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
              <input 
                type="file" 
                name="image" 
                onChange={handleFileChange} 
                className="w-full p-2 border rounded-lg" 
                accept="image/*"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
              
              {isLoading ? (
                <p className="text-gray-500">Loading ingredients...</p>
              ) : (
                <div className="grid grid-cols-12 gap-2 mb-3">
                  <div className="col-span-5">
                    <select 
                      value={selectedIngredient} 
                      onChange={(e) => setSelectedIngredient(e.target.value)} 
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Select Ingredient</option>
                      {availableIngredients.map(ingredient => (
                        <option key={ingredient._id} value={ingredient._id}>
                          {ingredient.name} ({ingredient.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-5">
                    <input 
                      type="number" 
                      placeholder="Quantity Required" 
                      value={ingredientQuantity} 
                      onChange={(e) => setIngredientQuantity(e.target.value)} 
                      className="w-full p-2 border rounded-lg" 
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <button 
                      type="button" 
                      onClick={handleAddIngredient} 
                      className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {product.ingredients.length > 0 ? (
                <ul className="space-y-2 mt-4">
                  {product.ingredients.map((ing, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span>
                        {ing.name} - {ing.quantityRequired} {ing.unit}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removeIngredient(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm mt-2">No ingredients added yet</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button 
              type="button" 
              onClick={closeModal} 
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
