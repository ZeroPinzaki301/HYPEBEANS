import React, { useState, useEffect } from "react";
import axios from "../utils/axiosInstance";

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  // Function to handle reorder
  const handleReorder = async (orderId) => {
    try {
      const response = await axios.put(
        `/api/orders/reorder/${orderId}`,
        { status: "Pending" },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      
      // Update the order status in the UI
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: "Pending" } : order
      ));
      
      alert("Order has been reordered successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reorder.");
    }
  };

  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (!userId) {
        setError("User ID not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/orders/history/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setOrders(response.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching order history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderHistory();
  }, [userId]);

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Order History</h1>

        {isLoading && <p className="text-gray-500 text-center">Loading...</p>}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="border p-4 rounded-lg shadow-md relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p><strong>Order ID:</strong> {order._id}</p>
                    <p><strong>Status:</strong> {order.status}</p>
                    <p className="text-sm text-gray-500">
                      Last Updated: {new Date(order.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  {/* Reorder Button (Top Right) */}
                  <button
                    onClick={() => handleReorder(order._id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Reorder
                  </button>
                </div>
                <div className="mt-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border px-4 py-2 text-left">Product Name</th>
                        <th className="border px-4 py-2 text-left">Quantity</th>
                        <th className="border px-4 py-2 text-left">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.product._id}>
                          <td className="border px-4 py-2">{item.product.name}</td>
                          <td className="border px-4 py-2">{item.quantity}</td>
                          <td className="border px-4 py-2">₱{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoading && (
            <p className="text-gray-500 text-center">You have no past orders.</p>
          )
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
