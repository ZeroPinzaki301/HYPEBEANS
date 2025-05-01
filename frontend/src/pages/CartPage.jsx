import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { useNavigate, Link } from "react-router-dom";

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");
  const [variantData, setVariantData] = useState({});
  const [productStocks, setProductStocks] = useState({});
  const [loadingStocks, setLoadingStocks] = useState({});
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Fetch product stock
  const fetchProductStock = async (productId) => {
    try {
      setLoadingStocks(prev => ({ ...prev, [productId]: true }));
      const { data } = await axiosInstance.get(`/api/products/${productId}`);
      setProductStocks(prev => ({
        ...prev,
        [productId]: data.stock
      }));
    } catch (err) {
      console.error(`Failed to fetch stock for product ${productId}:`, err);
    } finally {
      setLoadingStocks(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Fetch cart data
  useEffect(() => {
    if (!userId) {
      setError("User not found. Please log in.");
      return;
    }

    const fetchData = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/cart/${userId}`);
        const cartVariants = JSON.parse(localStorage.getItem("cartVariants") || "[]");
        const variantsMap = {};

        cartVariants.forEach((item) => {
          if (!variantsMap[item.productId]) {
            variantsMap[item.productId] = [];
          }
          variantsMap[item.productId].push({
            variant: item.variant,
            price: item.price,
            quantity: item.quantity || 1,
          });
        });

        setVariantData(variantsMap);
        setCart(data);

        // Fetch stock for each product
        data.items.forEach(item => {
          fetchProductStock(item.product._id);
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch cart items.");
      }
    };

    fetchData();
  }, [userId]);

  // Update quantity
  const handleUpdateQuantity = async (productId, newQuantity, variant) => {
    try {
      // Update localStorage
      const cartVariants = JSON.parse(localStorage.getItem("cartVariants") || "[]");
      const itemIndex = cartVariants.findIndex(
        (item) => item.productId === productId && item.variant === variant
      );

      if (itemIndex >= 0) {
        cartVariants[itemIndex].quantity = newQuantity;
        localStorage.setItem("cartVariants", JSON.stringify(cartVariants));
      }

      // Update state
      const variantsMap = {};
      cartVariants.forEach((item) => {
        if (!variantsMap[item.productId]) {
          variantsMap[item.productId] = [];
        }
        variantsMap[item.productId].push({
          variant: item.variant,
          price: item.price,
          quantity: item.quantity || 1,
        });
      });
      setVariantData(variantsMap);

      // Update backend
      await axiosInstance.put(`/api/cart/update/${userId}/${productId}`, {
        quantity: newQuantity,
      });

      // Update cart state
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.product._id === productId ? { ...item, quantity: newQuantity } : item
        ),
      }));
    } catch (err) {
      setError("Failed to update quantity.");
    }
  };

  // Remove item
  const handleRemoveItem = async (productId, variant) => {
    try {
      // Remove from localStorage
      let cartVariants = JSON.parse(localStorage.getItem("cartVariants") || "[]");
      cartVariants = cartVariants.filter(
        (item) => !(item.productId === productId && item.variant === variant)
      );
      localStorage.setItem("cartVariants", JSON.stringify(cartVariants));

      // Update state
      const variantsMap = {};
      cartVariants.forEach((item) => {
        if (!variantsMap[item.productId]) {
          variantsMap[item.productId] = [];
        }
        variantsMap[item.productId].push({
          variant: item.variant,
          price: item.price,
          quantity: item.quantity || 1,
        });
      });
      setVariantData(variantsMap);

      // Remove from backend
      await axiosInstance.delete(`/api/cart/remove/${userId}/${productId}`);

      // Update cart state
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.product._id !== productId),
      }));
    } catch (err) {
      setError("Failed to remove item.");
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!cart) return 0;

    return cart.items.reduce((total, item) => {
      const variants = variantData[item.product._id] || [];
      const variantTotal = variants.reduce((sum, variant) => {
        return sum + variant.price * (variant.quantity || 1);
      }, 0);

      return total + variantTotal;
    }, 0);
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
            {cart.items.flatMap((item) => {
              const variants = variantData[item.product._id] || [{ variant: "hot", price: item.product.price }];

              return variants.map((variantInfo, index) => (
                <div
                  key={`${item.product._id}-${variantInfo.variant}-${index}`}
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
                        {item.product.name} ({variantInfo.variant.toUpperCase()})
                      </h3>
                      <p className="text-zinc-600">₱{variantInfo.price} each</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button
                        className="bg-zinc-200 px-3 py-1 rounded-l hover:bg-zinc-300"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product._id,
                            Math.max(1, (variantInfo.quantity || 1) - 1),
                            variantInfo.variant
                          )
                        }
                      >
                        -
                      </button>
                      <span className="px-4">{variantInfo.quantity || 1}</span>
                      <button
                        className={`px-3 py-1 rounded-r ${
                          productStocks[item.product._id] !== undefined && 
                          (variantInfo.quantity || 1) >= productStocks[item.product._id]
                            ? "bg-zinc-300 cursor-not-allowed"
                            : "bg-zinc-200 hover:bg-zinc-300"
                        }`}
                        onClick={() => {
                          if (productStocks[item.product._id] === undefined || 
                              (variantInfo.quantity || 1) < productStocks[item.product._id]) {
                            handleUpdateQuantity(
                              item.product._id,
                              (variantInfo.quantity || 1) + 1,
                              variantInfo.variant
                            );
                          }
                        }}
                        disabled={
                          loadingStocks[item.product._id] || 
                          (productStocks[item.product._id] !== undefined && 
                           (variantInfo.quantity || 1) >= productStocks[item.product._id])
                        }
                      >
                        {loadingStocks[item.product._id] ? "..." : "+"}
                      </button>
                    </div>
                    <button
                      className="bg-zinc-800 text-white px-3 py-1 rounded text-sm"
                      onClick={() => handleRemoveItem(item.product._id, variantInfo.variant)}
                    >
                      Remove
                    </button>
                  </div>
                  {productStocks[item.product._id] !== undefined && (
                    <div className="text-xs text-zinc-500 mt-1">
                      Available: {productStocks[item.product._id]}
                    </div>
                  )}
                  <div className="mt-2 text-right font-medium">
                    Subtotal: ₱{(variantInfo.price * (variantInfo.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              ));
            })}
          </div>

          <div className="bg-white border border-zinc-200 p-6 rounded-lg shadow-md mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Total</h3>
              <p className="text-xl font-bold">₱{calculateTotalPrice().toFixed(2)}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                className="w-full bg-zinc-800 text-white py-3 rounded-lg hover:bg-zinc-700 transition"
                onClick={() => navigate(`/checkout/${userId}`)}
              >
                Proceed to Checkout
              </button>
              <Link
                to={`/cart-history/${userId}`}
                className="w-full bg-zinc-200 text-zinc-800 py-3 rounded-lg hover:bg-zinc-300 transition text-center"
              >
                View Cart History
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="text-zinc-500 text-center mt-8 mb-4">Your cart is empty</p>
          <Link
            to="/menu"
            className="inline-block bg-zinc-800 text-white px-6 py-2 rounded-lg hover:bg-zinc-700 transition"
          >
            Browse Menu
          </Link>
        </div>
      )}
    </div>
  );
};

export default CartPage;
