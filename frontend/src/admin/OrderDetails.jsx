import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { io } from "socket.io-client";
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const navigate = useNavigate();

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axiosInstance.get(`/orders/${orderId}`);
        setOrder(data.order);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching order details.");
      }
    };
    fetchOrder();
  }, [orderId]);

  // Socket.IO connection
  useEffect(() => {
    const socket = io(
      process.env.NODE_ENV === "production"
        ? "https://hypebeans.onrender.com"
        : "http://localhost:5000",
      {
        path: "/socket.io",
        transports: ["websocket"]
      }
    );

    socket.on("order-update", (updatedOrder) => {
      if (updatedOrder._id === orderId) {
        setOrder(prev => ({ ...prev, ...updatedOrder }));
        if (updatedOrder.status === "Out for Delivery") setShowMap(true);
        if (updatedOrder.status === "Delivered") setShowPrompt(true);
        if (updatedOrder.status.toLowerCase().includes("cancel")) setShowCancelPrompt(true);
      }
    });

    return () => socket.disconnect();
  }, [orderId]);

  const updateOrderStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      await axiosInstance.put(`/orders/update-status/${orderId}`, { status: newStatus });
      setOrder(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError(err.response?.data?.message || "Error updating status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-serif relative">
      {/* Back button and header */}
      <Link to="/admin/manage-orders" className="absolute top-4 left-4 bg-zinc-800 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg shadow-md transition duration-200 font-semibold">
        Back to Orders
      </Link>
      <h1 className="text-center text-3xl font-bold mb-8">Order Details</h1>

      {/* Error message */}
      {error && <p className="text-red-500 bg-red-100 p-4 rounded-lg mb-4">{error}</p>}

      {/* Order content */}
      {order ? (
        <div className={`bg-white p-6 rounded-lg shadow-lg max-w-3xl mx-auto ${showPrompt || showCancelPrompt ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Order details */}
          <h2 className="text-xl font-semibold mb-4">Order #{order._id}</h2>
          <p className="mb-4"><strong>User:</strong> {order.user?.name || "Unknown User"}</p>
          <p className="mb-4"><strong>Status:</strong> {order.status}</p>
          <p className="text-sm text-gray-500">Last Updated: {new Date(order.updatedAt).toLocaleString()}</p>

          {/* Items table */}
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-4">Items Ordered:</h3>
            <table className="w-full border-collapse">
              {/* Table content */}
            </table>
          </div>

          {/* Status update buttons */}
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4">Update Status:</h3>
            <div className="space-y-2">
              {["Preparing", "Processing", "Out for Delivery"].map((status) => (
                <button
                  key={status}
                  onClick={() => updateOrderStatus(status)}
                  disabled={isUpdating}
                  className={`w-full px-4 py-2 rounded-lg text-white ${
                    isUpdating ? "bg-gray-400" : 
                    status === "Preparing" ? "bg-yellow-600 hover:bg-yellow-700" :
                    status === "Processing" ? "bg-blue-600 hover:bg-blue-700" :
                    "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Google Map */}
          {showMap && order.deliveryLocation?.coordinates && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Customer Location:</h3>
              <div style={{ height: '450px', width: '100%' }}>
                <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    mapContainerStyle={{ height: '100%', width: '100%' }}
                    center={{
                      lat: order.deliveryLocation.coordinates[1],
                      lng: order.deliveryLocation.coordinates[0]
                    }}
                    zoom={15}
                  >
                    <Marker position={{
                      lat: order.deliveryLocation.coordinates[1],
                      lng: order.deliveryLocation.coordinates[0]
                    }} />
                  </GoogleMap>
                </LoadScript>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500">Loading order details...</p>
      )}

      {/* Prompt modals */}
      {showPrompt && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          {/* Modal content */}
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
