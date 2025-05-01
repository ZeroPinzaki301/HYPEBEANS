import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { FiShoppingCart, FiClock } from "react-icons/fi";

const CartHistoryPage = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartHistory = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/cart/history/${userId}`);
        setCarts(data);
      } catch (error) {
        console.error("Failed to load cart history");
      } finally {
        setLoading(false);
      }
    };

    fetchCartHistory();
  }, [userId]);

  const handleReorder = async (cartId) => {
    try {
      const { data } = await axiosInstance.post(`/api/cart/reorder/${userId}/${cartId}`);
      console.log(data.message);
      navigate("/cart"); // Redirect to cart page
    } catch (error) {
      console.error(error.response?.data?.message || "Failed to reorder items");
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FiClock className="text-blue-500" /> Your Cart History
      </h1>

      {carts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No previous carts found
        </div>
      ) : (
        <div className="space-y-4">
          {carts.map((cart) => (
            <div key={cart._id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">
                  {new Date(cart.updatedAt).toLocaleString()}
                </h3>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {cart.items.length} items
                </span>
              </div>

              <ul className="mb-4 space-y-2">
                {cart.items.map((item) => (
                  <li key={item.product._id} className="flex justify-between">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-bold">
                  ₱{cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </span>
                <button
                  onClick={() => handleReorder(cart._id)}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                >
                  <FiShoppingCart /> Reorder All
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CartHistoryPage;
