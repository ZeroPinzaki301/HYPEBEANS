import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import ProductModal from "../components/ProductModal";
import { Link } from "react-router-dom";
import { IoIosAdd } from "react-icons/io";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axiosInstance.get("/api/products");
        setProducts(data);
      } catch (err) {
        setError("Failed to fetch products. Please try again later.");
        console.error("Fetch Products Error:", err.response?.data?.message || err.message);
      }
    };

    const fetchIngredients = async () => {
      try {
        const { data } = await axiosInstance.get("/api/inventory");
        setIngredients(data);
      } catch (err) {
        console.error("Fetch Ingredients Error:", err.message);
      }
    };

    fetchProducts();
    fetchIngredients();
  }, []);

  const handleAddIngredient = async (productId, ingredientId, quantityRequired) => {
    try {
      await axiosInstance.put(`/api/products/add-ingredient/${productId}`, {
        ingredientId,
        quantityRequired,
      });

      alert("Ingredient added successfully!");
      const { data } = await axiosInstance.get("/api/products");
      setProducts(data);
    } catch (err) {
      alert("Failed to add ingredient. Please try again.");
      console.error("Add Ingredient Error:", err.message);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6 font-serif relative">
      <Link to="/admin-dashboard" className="absolute top-4 left-4 bg-zinc-800 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-200 font-semibold">
        Back to Dashboard
      </Link>

      <h1 className="text-center text-4xl font-bold mb-8">Manage Products</h1>

      {error && <p className="text-red-600 bg-red-100 p-4 rounded-lg mb-4">{error}</p>}

      <div className="flex">
        <select className="mb-6 p-2 border rounded-lg cursor-pointer" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All</option>
          <option value="beverages">Beverages</option>
          <option value="delights">Delights</option>
        </select>

        <button className="flex bg-zinc-800 text-white ml-6 px-6 py-3 rounded-lg mb-6 cursor-pointer" onClick={() => setShowModal(true)}>
          <IoIosAdd className="text-2xl mr-3" />
          Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products
          .filter((product) => filterType === "all" || product.productType === filterType)
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((product) => (
            <div key={product._id} className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl tracking-widest font-semibold mb-2">{product.name}</h2>
              <p className="text-lg">Price: ₱{product.price}</p>
              <p className="text-lg">Type: {product.productType}</p>
              {product.productType === "beverages" && <p className="text-lg">Beverage Type: {product.beverageType}</p>}
              <img src={`https://hypebeans.onrender.com/${product.image}`} alt={product.name} className="w-full h-40 object-cover rounded-lg mt-4" />

              <div className="flex gap-4 mt-5">
                <button className="bg-zinc-800 text-white p-[.5em] rounded-lg cursor-pointer" onClick={() => { setEditingProduct(product); setShowModal(true); }}>
                  Edit
                </button>
                <button className="bg-zinc-800 text-white p-[.5em] rounded-lg cursor-pointer" onClick={() => handleDeleteProduct(product._id)}>
                  Delete
                </button>
                <select className="p-2 border rounded-lg" onChange={(e) => handleAddIngredient(product._id, e.target.value, 1)}>
                  <option value="">Add Ingredient</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient._id} value={ingredient._id}>
                      {ingredient.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
      </div>

      <div className="flex justify-center mt-6">
        {[...Array(Math.ceil(products.length / itemsPerPage))].map((_, index) => (
          <button key={index} onClick={() => setCurrentPage(index + 1)} className={`px-4 py-2 mx-1 ${currentPage === index + 1 ? "bg-zinc-600 text-white" : "bg-gray-300"}`}>
            {index + 1}
          </button>
        ))}
      </div>

      {showModal && <ProductModal closeModal={() => { setShowModal(false); setEditingProduct(null); }} saveProduct={handleSaveProduct} editingProduct={editingProduct} />}
    </div>
  );
};

export default ManageProducts;
