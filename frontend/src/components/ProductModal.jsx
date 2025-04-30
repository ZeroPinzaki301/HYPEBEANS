import React, { useState, useEffect } from "react";
import axios from "axios";

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

  const [ingredientName, setIngredientName] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("g"); // Default unit

  useEffect(() => {
    if (editingProduct) {
      setProduct({
        ...editingProduct,
        imageFile: null,
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

  const handleAddIngredient = async () => {
    if (!ingredientName || !ingredientQuantity || !ingredientUnit) return;

    try {
      const { data } = await axios.post("/api/ingredients/check", { name: ingredientName });

      let ingredientEntry;
      if (data.exists) {
        // If ingredient exists, link it
        ingredientEntry = {
          ingredient: data.ingredient._id,
          quantityRequired: Number(ingredientQuantity),
          unit: ingredientUnit,
          name: ingredientName, // Keep name for display
        };
      } else {
        // If ingredient does not exist, create it
        const newIngredient = await axios.post("/api/ingredients/create", {
          name: ingredientName,
          quantity: ingredientQuantity,
          unit: ingredientUnit,
        });

        ingredientEntry = {
          ingredient: newIngredient.data._id,
          quantityRequired: Number(ingredientQuantity),
          unit: ingredientUnit,
          name: ingredientName, // Keep name for display
        };
      }

      setProduct((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredientEntry],
      }));

      // Clear input fields
      setIngredientName("");
      setIngredientQuantity("");
      setIngredientUnit("g");
    } catch (error) {
      console.error("Error adding ingredient", error);
    }
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

    saveProduct(product, product.imageFile);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">
          {editingProduct ? "Edit Product" : "Add Product"}
        </h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Product Name" value={product.name} onChange={handleChange} className="w-full p-2 border mb-4 rounded-lg" required />
          <input type="number" name="price" placeholder="Price" value={product.price} onChange={handleChange} className="w-full p-2 border mb-4 rounded-lg" required />
          <textarea name="description" placeholder="Description" value={product.description} onChange={handleChange} className="w-full p-2 border mb-4 rounded-lg" required></textarea>
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

          {/* Ingredient Input */}
          <div className="mb-4">
            <input type="text" placeholder="Ingredient Name" value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} className="w-full p-2 border mb-2 rounded-lg" />
            <input type="number" placeholder="Quantity" value={ingredientQuantity} onChange={(e) => setIngredientQuantity(e.target.value)} className="w-full p-2 border mb-2 rounded-lg" />
            <select value={ingredientUnit} onChange={(e) => setIngredientUnit(e.target.value)} className="w-full p-2 border mb-2 rounded-lg">
              <option value="g">Grams (g)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="pcs">Pieces (pcs)</option>
            </select>
            <button type="button" onClick={handleAddIngredient} className="bg-green-600 text-white px-4 py-2 rounded-lg">Add Ingredient</button>
          </div>

          {/* Display Added Ingredients */}
          <ul className="mb-4">
            {product.ingredients.map((ing, index) => (
              <li key={index} className="bg-gray-100 p-2 rounded-lg mb-2">{ing.name} - {ing.quantityRequired} {ing.unit}</li>
            ))}
          </ul>

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
