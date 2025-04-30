import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const ProductModal = ({ closeModal, saveProduct, editingProduct }) => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    productType: "beverages", // Default value
    beverageType: "",
    imageFile: null,
    ingredients: [], // New field for ingredients
  });

  const [ingredients, setIngredients] = useState([]); // List of available ingredients
  const [selectedIngredients, setSelectedIngredients] = useState([]); // Selected ingredient quantities

  useEffect(() => {
    // Fetch available ingredients
    const fetchIngredients = async () => {
      try {
        const { data } = await axiosInstance.get("/api/inventory/ingredients");
        setIngredients(data);
      } catch (err) {
        console.error("Error fetching ingredients:", err);
      }
    };

    fetchIngredients();

    // Populate the form with existing product details if editing
    if (editingProduct) {
      setProduct({ ...editingProduct, imageFile: null });
      setSelectedIngredients(editingProduct.ingredients || []);
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: value,
      ...(name === "productType" && value === "delights" ? { beverageType: "" } : {}),
    }));
  };

  const handleFileChange = (e) => {
    setProduct((prevProduct) => ({ ...prevProduct, imageFile: e.target.files[0] }));
  };

  const handleIngredientChange = (ingredientId, quantity) => {
    setSelectedIngredients((prev) => {
      const updatedIngredients = [...prev];
      const index = updatedIngredients.findIndex((i) => i.ingredient === ingredientId);
      
      if (index !== -1) {
        updatedIngredients[index].quantity = quantity;
      } else {
        updatedIngredients.push({ ingredient: ingredientId, quantity });
      }

      return updatedIngredients;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!product.name || !product.price || !product.description || !product.productType) {
      alert("Please fill out all required fields.");
      return;
    }

    if (product.productType === "beverages" && !product.beverageType) {
      alert("Please select a beverage type.");
      return;
    }

    // Pass product data and ingredient selections
    saveProduct({ ...product, ingredients: selectedIngredients }, product.imageFile);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{editingProduct ? "Edit Product" : "Add Product"}</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Product Name" value={product.name} onChange={handleChange} className="w-full p-2 border mb-4 rounded-lg" required />
          <input type="number" name="price" placeholder="Price" value={product.price} onChange={handleChange} className="w-full p-2 border mb-4 rounded-lg" required />
          <textarea name="description" placeholder="Description" value={product.description} onChange={handleChange} className="w-full p-2 border mb-4 rounded-lg" required />

          <select name="productType" value={product.productType} onChange={handleChange} className="w-full p-2 border mb-4 rounded-lg" required>
            <option value="beverages">Beverages</option>
            <option value="delights">Delights</option>
          </select>

          {product.productType === "beverages" && (
            <select name="beverageType" value={product.beverageType} onChange={handleChange} className="w-full p-2 border mb-4 rounded-lg">
              <option value="">Select Beverage Type</option>
              <option value="espresso based">Espresso Based</option>
              <option value="coffee based frappe">Coffee Based Frappe</option>
              <option value="non-coffee based">Non-Coffee Based</option>
              <option value="non-coffee based frappe">Non-Coffee Based Frappe</option>
              <option value="refreshments">Refreshments</option>
              <option value="cold brew specials">Cold Brew Specials</option>
            </select>
          )}

          <input type="file" name="image" onChange={handleFileChange} className="w-full p-2 border mb-4 rounded-lg" />

          {/* Ingredient Selection */}
          <div className="mb-4">
            <h3 className="font-bold">Select Ingredients:</h3>
            {ingredients.map((ingredient) => (
              <div key={ingredient._id} className="flex items-center mb-2">
                <label className="mr-2">{ingredient.name} ({ingredient.unit})</label>
                <input type="number" min="0" placeholder="Qty" onChange={(e) => handleIngredientChange(ingredient._id, parseFloat(e.target.value))} className="w-20 border p-1 rounded-lg" />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button type="button" onClick={closeModal} className="bg-gray-600 text-white px-6 py-2 rounded-lg">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
