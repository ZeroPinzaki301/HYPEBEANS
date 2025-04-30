import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import ProductModal from "../components/ProductModal";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get("/product");
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  const openModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const saveProduct = async (productData, imageFile) => {
    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("price", productData.price);
    formData.append("description", productData.description);
    formData.append("productType", productData.productType);

    if (productData.productType === "beverages") {
      formData.append("beverageType", productData.beverageType);
    }

    if (imageFile) {
      formData.append("image", imageFile);
    }

    formData.append("ingredients", JSON.stringify(productData.ingredients));

    try {
      const response = await axiosInstance.post("/product/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Product created:", response.data);
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("There was an error saving the product.");
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Products</h1>
        <button
          onClick={openModal}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product._id} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-gray-600">{product.description}</p>
            <p className="text-sm">₱{product.price}</p>
            <p className="text-sm italic">{product.productType}</p>
            {product.image && (
              <img
                src={`/uploads/${product.image}`}
                alt={product.name}
                className="mt-2 max-h-40 object-cover rounded"
              />
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ProductModal
          closeModal={closeModal}
          saveProduct={saveProduct}
          editingProduct={editingProduct}
        />
      )}
    </div>
  );
};

export default Products;
