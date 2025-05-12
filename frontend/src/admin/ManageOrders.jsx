import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { io } from "socket.io-client";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Payment ID copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
  };

  // Fetch Orders on Initial Render
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axiosInstance.get("/api/orders");
        setOrders(data.orders || []);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching orders.");
      }
    };

    fetchOrders();
  }, []);

  // Real-Time Updates for New Orders and Status Changes
  useEffect(() => {
    const socket = io("https://hypebeans.onrender.com");

    socket.on("new-order", (order) => {
      setOrders((prevOrders) => [order, ...prevOrders]);
    });

    socket.on("order-canceled", (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? { ...order, status: "Canceled" } : order
        )
      );
    });

    socket.on("order-delivered", (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === updatedOrder._id ? { ...order, status: "Delivered" } : order
        )
      );
    });

    return () => socket.disconnect();
  }, []);

  const openOrderDetails = (orderId) => {
    navigate(`/admin/manage-orders/${orderId}`);
  };

  const viewPaymentProof = (paymentProofId) => {
    navigate(`/admin/payment-proof/${paymentProofId}`);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6 font-serif">
      <Link
        to="/admin-dashboard"
        className="absolute top-4 left-4 bg-zinc-800 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-200 font-semibold"
      >
        Back to Dashboard
      </Link>

      <h1 className="text-center text-4xl font-bold mb-8">Manage Orders</h1>

      {error && (
        <p className="text-red-500 bg-red-100 p-4 rounded-lg mb-4">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.isArray(orders) && orders.length > 0 ? (
          [...orders].sort((a, b) => {
            const priorityA = a.status === "Canceled" || a.status === "Delivered" ? 1 : 0;
            const priorityB = b.status === "Canceled" || b.status === "Delivered" ? 1 : 0;
            return priorityA - priorityB;
          }).map((order) => (
            <div
              key={order._id}
              className={`bg-white p-4 rounded-lg shadow-md cursor-pointer relative ${
                order.status === "Canceled" || order.status === "Delivered"
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-lg"
              }`}
              onClick={() => {
                if (order.status !== "Canceled" && order.status !== "Delivered") openOrderDetails(order._id);
              }}
            >
              {/* View Payment Proof Button (Top Right) */}
              {order.paymentMethod === "GCash" && order.gcashPaymentProof && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    viewPaymentProof(order.gcashPaymentProof);
                  }}
                  className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  View Proof
                </button>
              )}

              <h2 className="text-lg font-semibold mb-2">Order #{order._id.slice(-6).toUpperCase()}</h2>
              <p>User: {order.user?.name || "Unknown User"}</p>
              <p>Payment Method: {order.paymentMethod}</p>
              
              {/* Payment ID with Copy Button */}
              <div className="flex items-center gap-2">
                <p>Payment ID: {order.gcashPaymentProof || "N/A"}</p>
                {order.gcashPaymentProof && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(order.gcashPaymentProof);
                    }}
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                  >
                    Copy
                  </button>
                )}
              </div>

              <p>Status: {order.status}</p>
              <p>
                Delivery:{" "}
                {order.deliveryLocation?.coordinates
                  ? order.deliveryLocation.coordinates.join(", ")
                  : "N/A"}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">
            No orders available to manage.
          </p>
        )}
      </div>
    </div>
  );
};

export default ManageOrders;
