import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    gpsLocation: null,
    manualAddress: "",
    purchaseType: "Delivery",
    paymentMethod: "GCash",
    gcashNumber: "",
    proofImage: null
  });

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        setLoading(true);
        // Fetch the current active cart with populated products
        const { data } = await axiosInstance.get(`/api/cart/${userId}?populate=items.product`);
        
        if (!data?.success || !data.cart) {
          throw new Error("Failed to load cart data");
        }

        console.log("Fetched cart:", data.cart); // Debug log
        setCart(data.cart);

      } catch (error) {
        console.error("Cart fetch error:", error);
        setError(error.response?.data?.message || "Failed to load cart items");
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();

    // Get GPS location if delivery
    if (formData.purchaseType === "Delivery" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gpsLocation: {
              type: "Point",
              coordinates: [position.coords.longitude, position.coords.latitude]
            }
          }));
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Please enable location services for delivery");
        }
      );
    }
  }, [userId, formData.purchaseType]);

  const calculateTotals = () => {
    if (!cart.items) return { subtotal: 0, deliveryFee: 0, total: 0, items: [] };

    const items = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      price: item.price,
      quantity: item.quantity
    }));

    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = formData.purchaseType === "Delivery" ? 50 : 0;
    const total = subtotal + deliveryFee;

    return { subtotal, deliveryFee, total, items };
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const { items } = calculateTotals();

      const orderData = {
        items,
        paymentMethod: formData.paymentMethod,
        purchaseType: formData.purchaseType,
        ...(formData.purchaseType === "Delivery" && {
          deliveryLocation: formData.gpsLocation,
          manualAddress: formData.manualAddress
        })
      };

      const response = await axiosInstance.post(`/api/orders/checkout/${userId}`, orderData);
      
      if (response.data.success) {
        // Clear cart after successful checkout
        await axiosInstance.delete(`/api/cart/clear/${userId}`);
        navigate("/orders/ongoing");
      } else {
        throw new Error(response.data.message || "Checkout failed");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setError(error.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading cart...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  const { subtotal, deliveryFee, total } = calculateTotals();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      {cart.items?.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Your Order</h2>
            {cart.items.map(item => (
              <div key={item.product._id} className="flex justify-between py-2 border-b">
                <span>{item.product.name}</span>
                <span>{item.quantity} × ₱{item.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="mt-4 pt-2 border-t">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {formData.purchaseType === "Delivery" && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>₱{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold mt-2">
                <span>Total:</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Order Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.purchaseType === "Delivery"}
                    onChange={() => setFormData({...formData, purchaseType: "Delivery"})}
                    className="mr-2"
                  />
                  Delivery
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.purchaseType === "Dine In"}
                    onChange={() => setFormData({...formData, purchaseType: "Dine In"})}
                    className="mr-2"
                  />
                  Dine In
                </label>
              </div>
            </div>

            {formData.purchaseType === "Delivery" && (
              <div className="mb-4">
                <label className="block mb-2 font-medium">Delivery Address</label>
                <input
                  type="text"
                  value={formData.manualAddress}
                  onChange={(e) => setFormData({...formData, manualAddress: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Enter your address"
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-2 font-medium">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="GCash">GCash</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            {formData.paymentMethod === "GCash" && (
              <>
                <div className="mb-4">
                  <label className="block mb-2 font-medium">GCash Number</label>
                  <input
                    type="text"
                    value={formData.gcashNumber}
                    onChange={(e) => setFormData({...formData, gcashNumber: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="09123456789"
                    pattern="09[0-9]{9}"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2 font-medium">Proof of Payment</label>
                  <input
                    type="file"
                    onChange={(e) => setFormData({...formData, proofImage: e.target.files[0]})}
                    className="w-full p-2 border rounded"
                    accept="image/*"
                    required
                  />
                </div>
              </>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate("/menu")}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Browse Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
