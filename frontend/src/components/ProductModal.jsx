import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const ProductModal = ({ closeModal, saveProduct, editingProduct, isSaving }) => {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    productType: "beverages",
    beverageType: "",
    imageFile: null,
    ingredients: [], // Store ingredients with name, quantity, unit
  });

  const [availableUnits, setAvailableUnits] = useState(["g", "ml", "pcs"]);
  const [existingIngredients, setExistingIngredients] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch existing ingredients when modal opens
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await axiosInstance.get("/inventory/ingredients");
        setExistingIngredients(response.data);
      } catch (error) {
        console.error("Failed to fetch ingredients:", error);
      }
    };
    fetchIngredients();

    if (editingProduct) {
      // If editing, populate with existing product data
      setProduct({
        name: editingProduct.name || "",
        price: editingProduct.price?.toString() || "",
        description: editingProduct.description || "",
        productType: editingProduct.productType || "beverages",
        beverageType: editingProduct.beverageType || "",
        imageFile: null,
        ingredients: editingProduct.recipe?.ingredients || [],
      });
      
      if (editingProduct.image) {
        setPreviewImage(editingProduct.image);
      }
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
    const file = e.target.files[0];
    if (file) {
      setProduct((prevProduct) => ({
        ...prevProduct,
        imageFile: file,
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    setProduct((prevProduct) => {
      const updatedIngredients = [...prevProduct.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [field]: field === "quantity" ? parseFloat(value) || 0 : value,
      };
      return { ...prevProduct, ingredients: updatedIngredients };
    });
  };

  const addIngredientField = () => {
    setProduct((prevProduct) => ({
      ...prevProduct,
      ingredients: [
        ...prevProduct.ingredients,
        { name: "", quantity: 1, unit: "g" }, // Default unit to grams
      ],
    }));
  };

  const removeIngredientField = (index) => {
    setProduct((prevProduct) => {
      const updatedIngredients = prevProduct.ingredients.filter((_, i) => i !== index);
      return { ...prevProduct, ingredients: updatedIngredients };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate the required fields
    if (!product.name || !product.price || !product.description || !product.productType) {
      alert("Please fill out all required fields.");
      return;
    }

    // Validate price is a positive number
    if (isNaN(parseFloat(product.price)) || parseFloat(product.price) <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    // Additional validation for beverages
    if (product.productType === "beverages" && !product.beverageType) {
      alert("Please select a beverage type.");
      return;
    }

    // Validate ingredients
    if (product.ingredients.some(ing => !ing.name || isNaN(ing.quantity) || ing.quantity <= 0)) {
      alert("Please provide valid names and quantities for all ingredients.");
      return;
    }

    // Pass product data and image file to the parent component
    saveProduct({
      ...product,
      price: parseFloat(product.price),
    }, product.imageFile);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {editingProduct ? "Edit Product" : "Add Product"}
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Basic product fields (name, price, description, etc.) */}
          {/* ... (keep your existing product fields) ... */}

          {/* Ingredients Section */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Ingredients</h3>
            {product.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center mb-2 gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Ingredient Name"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    list="ingredient-list"
                    required
                  />
                  <datalist id="ingredient-list">
                    {existingIngredients.map((ing) => (
                      <option key={ing._id} value={ing.name} />
                    ))}
                  </datalist>
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Qty"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                  className="w-20 border p-1 rounded-lg"
                  required
                />
                <select
                  value={ingredient.unit}
                  onChange={(e) => handleIngredientChange(index, "unit", e.target.value)}
                  className="w-20 border p-1 rounded-lg"
                >
                  {availableUnits.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeIngredientField(index)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg"
                >
                  ×
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

          {/* Image upload and buttons */}
          {/* ... (keep your existing image and button fields) ... */}
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
