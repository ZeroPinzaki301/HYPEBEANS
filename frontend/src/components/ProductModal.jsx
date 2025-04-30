import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

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

  useEffect(() => {
    if (editingProduct) {
      setProduct({ ...editingProduct, imageFile: null });
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

  const handleIngredientChange = (index, field, value) => {
    setProduct((prev) => {
      const updated = [...prev.ingredients];
      updated[index][field] = value;
      return { ...prev, ingredients: updated };
    });
  };

  const addIngredientField = () => {
    setProduct((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", quantity: 1, unit: "pcs" }],
    }));
  };

  const removeIngredientField = (index) => {
    setProduct((prev) => {
      const updated = prev.ingredients.filter((_, i) => i !== index);
      return { ...prev, ingredients: updated };
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

    if (product.ingredients.some((ing) => !ing.name)) {
      alert("Please provide names for all ingredients.");
      return;
    }

    saveProduct(product, product.imageFile);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{editingProduct ? "Edit Product" : "Add Product"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={product.name}
            onChange={handleChange}
            className="w-full p-2 border mb-4 rounded-lg"
            required
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={product.price}
            onChange={handleChange}
            className="w-full p-2 border mb-4 rounded-lg"
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            value={product.description}
            onChange={handleChange}
            className="w-full p-2 border mb-4 rounded-lg"
            required
          />
          <select
            name="productType"
            value={product.productType}
            onChange={handleChange}
            className="w-full p-2 border mb-4 rounded-lg"
            required
          >
            <option value="beverages">Beverages</option>
            <option value="delights">Delights</option>
          </select>

          {product.productType === "beverages" && (
            <select
              name="beverageType"
              value={product.beverageType}
              onChange={handleChange}
              className="w-full p-2 border mb-4 rounded-lg"
            >
              <option value="">Select Beverage Type</option>
              <option value="espresso based">Espresso Based</option>
              <option value="coffee based frappe">Coffee Based Frappe</option>
              <option value="non-coffee based">Non-Coffee Based</option>
              <option value="non-coffee based frappe">Non-Coffee Based Frappe</option>
              <option value="refreshments">Refreshments</option>
              <option value="cold brew specials">Cold Brew Specials</option>
            </select>
          )}

          <input
            type="file"
            name="image"
            onChange={handleFileChange}
            className="w-full p-2 border mb-4 rounded-lg"
          />

          <div className="mb-4">
            <h3 className="font-bold mb-2">Recipe Ingredients:</h3>
            {product.ingredients.map((ing, i) => (
              <div key={i} className="flex items-center mb-2 gap-2">
                <input
                  type="text"
                  placeholder="Ingredient Name"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(i, "name", e.target.value)}
                  className="w-2/3 p-2 border rounded-lg"
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(i, "quantity", e.target.value)}
                  className="w-20 border p-1 rounded-lg"
                  required
                />
                <select
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(i, "unit", e.target.value)}
                  className="w-20 border p-1 rounded-lg"
                >
                  <option value="pcs">pcs</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeIngredientField(i)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg"
                >
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredientField}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg mt-2"
            >
              + Add Ingredient
            </button>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
