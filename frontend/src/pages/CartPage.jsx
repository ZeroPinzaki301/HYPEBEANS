import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");
  const [productStocks, setProductStocks] = useState({});
  const [loadingStocks, setLoadingStocks] = useState({});
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Fetch stock for a single product
  const fetchProductStock = async (productId) => {
    try {
      setLoadingStocks(prev => ({ ...prev, [productId]: true }));
      const { data } = await axiosInstance.get(`/api/products/${productId}`);
      setProductStocks(prev => ({
        ...prev,
        [productId]: data.variants // Now using variants stock from backend
      }));
    } catch (err) {
      console.error(`Failed to fetch stock for product ${productId}:`, err);
    } finally {
      setLoadingStocks(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Fetch cart and product data
  useEffect(() => {
    if (!userId) {
      setError("User not found. Please log in.");
      return;
    }

    const fetchData = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/cart/${userId}`);
        setCart(data);

        // Fetch stock for each unique product in cart
        const uniqueProductIds = [...new Set(data.items.map(item => item.product._id))];
        uniqueProductIds.forEach(productId => {
          fetchProductStock(productId);
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch cart items.");
      }
    };

    fetchData();
  }, [userId]);

  // Update quantity of a cart item
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await axiosInstance.put(`/api/cart/update-item/${userId}/${itemId}`, {
        quantity: newQuantity
      });
  
      setCart(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item._id === itemId ? { ...item, quantity: newQuantity } : item
        )
      }));
    } catch (err) {
      setError("Failed to update quantity.");
    }
  };
  
  // Remove an item from the cart
  const handleRemoveItem = async (itemId) => {
    try {
      await axiosInstance.delete(`/api/cart/remove-item/${userId}/${itemId}`);
  
      setCart(prev => ({
        ...prev,
        items: prev.items.filter(item => item._id !== itemId)
      }));
    } catch (err) {
      setError("Failed to remove item.");
    }
  };
  
  // Calculate total price
  const calculateTotalPrice = () => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="bg-zinc-100 min-h-screen p-4 sm:p-6 font-serif relative w-[95%] sm:w-[90%] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          className="text-zinc-700 hover:text-zinc-500 transition duration-200 font-medium cursor-pointer"
          onClick={() => window.history.back()}
        >
          <IoArrowBackCircleSharp className="text-4xl sm:text-5xl" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-800 text-center">Your Cart</h1>
      </div>

      {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center">{error}</p>}

      {cart?.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {cart.items.map((item) => {
              const stockInfo = productStocks[item.product._id]?.[item.variant] || {};
              const maxQuantity = stockInfo.stock || Infinity;

              return (
                <div
                  key={item._id}
                  className="bg-white border border-zinc-200 p-4 rounded-lg shadow-md"
                >
                  <div className="flex items-center mb-4">
                    <img
                      src={`https://hypebeans.onrender.com/${item.product.image}`}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-bold text-zinc-800">
                        {item.product.name} ({item.variant.toUpperCase()})
                      </h3>
                      <p className="text-zinc-600">₱{item.price} each</p>
                      <p className="text-sm text-zinc-500">
                        Size: {item.variant === "hot" ? "10oz" : "16oz"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button
                        className="bg-zinc-200 px-3 py-1 rounded-l hover:bg-zinc-300"
                        onClick={() => handleUpdateQuantity(item._id, Math.max(1, item.quantity - 1))}
                      >
                        -
                      </button>
                      <span className="px-4">{item.quantity}</span>
                      <button
                        className={`px-3 py-1 rounded-r ${
                          item.quantity >= maxQuantity
                            ? "bg-zinc-300 cursor-not-allowed"
                            : "bg-zinc-200 hover:bg-zinc-300"
                        }`}
                        onClick={() => {
                          if (item.quantity < maxQuantity) {
                            handleUpdateQuantity(item._id, item.quantity + 1);
                          }
                        }}
                        disabled={item.quantity >= maxQuantity}
                      >
                        {loadingStocks[item.product._id] ? "..." : "+"}
                      </button>
                    </div>
                    <button
                      className="bg-zinc-800 text-white px-3 py-1 rounded text-sm"
                      onClick={() => handleRemoveItem(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                  {maxQuantity !== Infinity && (
                    <div className="text-xs text-zinc-500 mt-1">
                      Available: {maxQuantity}
                    </div>
                  )}
                  <div className="mt-2 text-right font-medium">
                    Subtotal: ₱{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-zinc-200 p-6 rounded-lg shadow-md mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Total</h3>
              <p className="text-xl font-bold">₱{calculateTotalPrice().toFixed(2)}</p>
            </div>
            <button
              className="w-full bg-zinc-800 text-white py-3 rounded-lg hover:bg-zinc-700 transition"
              onClick={() => navigate(`/checkout/${userId}`)}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      ) : (
        <p className="text-zinc-500 text-center mt-8">Your cart is empty</p>
      )}
    </div>
  );
};

export default CartPage;
