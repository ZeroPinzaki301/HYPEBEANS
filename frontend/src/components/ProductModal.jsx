import React, { useState, useEffect } from "react";

const ProductModal = ({ closeModal, saveProduct, editingProduct, isSaving }) => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    productType: "beverages",
    beverageType: "",
    imageFile: null,
    ingredients: [],
  });

  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (editingProduct) {
      // Initialize with existing product data
      setProduct({
        name: editingProduct.name || "",
        price: editingProduct.price?.toString() || "",
        description: editingProduct.description || "",
        productType: editingProduct.productType || "beverages",
        beverageType: editingProduct.beverageType || "",
        imageFile: null,
        ingredients: editingProduct.ingredients?.map(ing => ({
          name: ing.name || "",
          quantity: ing.quantity?.toString() || "1",
          unit: ing.unit || "pcs"
        })) || []
      });

      // Set image preview if exists
      if (editingProduct.image) {
        setPreviewImage(editingProduct.image);
      }
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value,
      // Clear beverageType if switching to delights
      ...(name === "productType" && value === "delights" ? { beverageType: "" } : {}),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct(prev => ({ ...prev, imageFile: file }));
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    setProduct(prev => {
      const updatedIngredients = [...prev.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: value
      };
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  const addIngredientField = () => {
    setProduct(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: "", quantity: "1", unit: "pcs" }]
    }));
  };

  const removeIngredientField = (index) => {
    setProduct(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!product.name || !product.price || !product.description || !product.productType) {
      alert("Please fill out all required fields.");
      return;
    }

    // Validate price is a positive number
    if (isNaN(parseFloat(product.price)) || parseFloat(product.price) <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    // Validate beverage type if applicable
    if (product.productType === "beverages" && !product.beverageType) {
      alert("Please select a beverage type.");
      return;
    }

    // Validate all ingredients have names and valid quantities
    if (product.ingredients.some(ing => !ing.name || isNaN(parseFloat(ing.quantity)) || parseFloat(ing.quantity) <= 0)) {
      alert("Please provide valid names and quantities for all ingredients.");
      return;
    }

    // Prepare data for submission
    const submissionData = {
      name: product.name,
      price: parseFloat(product.price),
      description: product.description,
      productType: product.productType,
      beverageType: product.productType === "beverages" ? product.beverageType : undefined,
      ingredients: product.ingredients.map(ing => ({
        name: ing.name.trim(),
        quantity: parseFloat(ing.quantity),
        unit: ing.unit || "pcs"
      }))
    };

    saveProduct(submissionData, product.imageFile);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {editingProduct ? "Edit Product" : "Add Product"}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Product Name */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              name="name"
              value={product.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Price *</label>
            <input
              type="number"
              name="price"
              value={product.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={product.description}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              rows="3"
              required
            />
          </div>

          {/* Product Type */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Product Type *</label>
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

          {/* Beverage Type (conditional) */}
          {product.productType === "beverages" && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Beverage Type *</label>
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

          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Product Image</label>
            {previewImage && (
              <div className="mb-2">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="max-w-full h-32 object-contain border rounded"
                />
              </div>
            )}
            <input
              type="file"
              name="image"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full p-2 border rounded-lg"
            />
          </div>

          {/* Ingredients Section */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Recipe Ingredients</label>
            {product.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center mb-2 gap-2">
                <input
                  type="text"
                  placeholder="Ingredient Name"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                  className="flex-1 p-2 border rounded-lg"
                  required
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="w-20 p-2 border rounded-lg"
                  required
                />
                <select
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, "unit", e.target.value)}
                  className="w-20 p-2 border rounded-lg"
                >
                  <option value="pcs">pcs</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeIngredientField(index)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredientField}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg mt-2 hover:bg-blue-600 transition"
            >
              + Add Ingredient
            </button>
          </div>

          {/* Form Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingProduct ? "Updating..." : "Creating..."}
                </span>
              ) : (
                <span>{editingProduct ? "Update" : "Create"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
