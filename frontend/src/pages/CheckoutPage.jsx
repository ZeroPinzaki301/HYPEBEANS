import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [cart, setCart] = useState({ items: [] });
  const [variantData, setVariantData] = useState({});
  const [formData, setFormData] = useState({
    gpsLocation: null,
    manualAddress: "",
    purchaseType: "Delivery",
    paymentMethod: "GCash",
    gcashNumber: "",
    proofImage: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cart from backend
        const { data } = await axiosInstance.get(`/api/cart/${userId}`);
        
        if (!data?.success || !data.cart) {
          throw new Error("Failed to load cart data");
        }

        setCart(data.cart);

        // Load variant info from localStorage
        const cartVariants = JSON.parse(localStorage.getItem('cartVariants') || '[]');
        const variantsMap = {};
        
        cartVariants.forEach(item => {
          if (!variantsMap[item.productId]) {
            variantsMap[item.productId] = [];
          }
          variantsMap[item.productId].push({
            variant: item.variant,
            price: item.price,
            quantity: item.quantity || 1
          });
        });
        
        setVariantData(variantsMap);
      } catch (error) {
        setError(error.response?.data?.message || "Failed to fetch cart items");
      }
    };

    fetchData();

    // Get GPS location only for delivery orders
    if (formData.purchaseType === "Delivery" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gpsLocation: {
              type: "Point",
              coordinates: [position.coords.longitude, position.coords.latitude],
            }
          }));
        },
        (error) => {
          console.error("GPS Error:", error);
          setError("Please enable location services for delivery");
        }
      );
    }
  }, [userId, formData.purchaseType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      proofImage: e.target.files[0]
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    const items = [];

    cart.items?.forEach(item => {
      const variants = variantData[item.product?._id] || [{ variant: 'regular', price: item.price, quantity: 1 }];
      
      variants.forEach(variant => {
        const price = variant.price || item.price;
        const quantity = variant.quantity || 1;
        subtotal += price * quantity;
        
        items.push({
          product: item.product._id,
          name: item.product.name,
          variant: variant.variant,
          price,
          quantity
        });
      });
    });

    const deliveryFee = formData.purchaseType === "Delivery" ? 50 : 0;
    const total = subtotal + deliveryFee;

    return { subtotal, deliveryFee, total, items };
  };

  const validateForm = () => {
    if (cart.items?.length === 0) {
      setError("Your cart is empty");
      return false;
    }

    if (formData.purchaseType === "Delivery") {
      if (!formData.gpsLocation) {
        setError("Please enable GPS for delivery");
        return false;
      }

      if (!formData.manualAddress.trim()) {
        setError("Please enter your delivery address");
        return false;
      }
    }

    if (formData.paymentMethod === "GCash") {
      if (!formData.gcashNumber || !/^09\d{9}$/.test(formData.gcashNumber)) {
        setError("Please enter a valid GCash number (11 digits starting with 09)");
        return false;
      }

      if (!formData.proofImage) {
        setError("Please upload proof of payment for GCash");
        return false;
      }
    }

    return true;
  };

  const handleProofUpload = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formDataObj = new FormData();
    formDataObj.append("userId", userId);
    formDataObj.append("gcashNumber", formData.gcashNumber);
    formDataObj.append("proofImage", formData.proofImage);

    try {
      setIsProcessing(true);
      await axiosInstance.post("/api/payment-proof/upload", formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Proof of payment uploaded successfully");
      setError("");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to upload proof of payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setError("");
    setSuccess("");

    try {
      const { items } = calculateTotals();
      
      const orderData = {
        items,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === "GCash" ? "Paid" : "Pending",
        purchaseType: formData.purchaseType
      };

      if (formData.purchaseType === "Delivery") {
        orderData.deliveryLocation = formData.gpsLocation;
        orderData.manualAddress = formData.manualAddress;
      }

      await axiosInstance.post(`/api/orders/checkout/${userId}`, orderData);

      // Clear cart variants from localStorage after successful checkout
      localStorage.removeItem('cartVariants');
      
      setSuccess("Order placed successfully! Redirecting...");
      setTimeout(() => navigate("/orders/ongoing"), 2000);
    } catch (error) {
      setError(error.response?.data?.message || "Checkout failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { subtotal, deliveryFee, total } = calculateTotals();

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-6 font-serif">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8">Checkout</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
          <p>{success}</p>
        </div>
      )}

      {cart.items?.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Left Column - Cart Items */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Your Order</h2>
            {cart.items.flatMap(item => {
              const variants = variantData[item.product?._id] || [{ variant: 'regular', price: item.price, quantity: 1 }];
              return variants.map((variant, index) => (
                <div 
                  key={`${item.product?._id}-${variant.variant}-${index}`} 
                  className="flex justify-between py-3 border-b"
                >
                  <span className="flex-1">
                    {item.product?.name} ({variant.variant.toUpperCase()})
                  </span>
                  <span className="ml-4 whitespace-nowrap">
                    {variant.quantity} × ₱{variant.price.toFixed(2)}
                  </span>
                </div>
              ));
            })}
          </div>

          {/* Right Column - Checkout Form */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Order Type</h2>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="purchaseType"
                    className="mr-2"
                    checked={formData.purchaseType === "Delivery"}
                    onChange={() => setFormData(prev => ({...prev, purchaseType: "Delivery"}))}
                  />
                  Delivery
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="purchaseType"
                    className="mr-2"
                    checked={formData.purchaseType === "Dine In"}
                    onChange={() => setFormData(prev => ({...prev, purchaseType: "Dine In"}))}
                  />
                  Dine In
                </label>
              </div>

              {formData.purchaseType === "Delivery" && (
                <>
                  <div className="mb-4">
                    <label className="block font-semibold mb-2">Delivery Address</label>
                    <input
                      type="text"
                      name="manualAddress"
                      placeholder="Enter your full address"
                      className="w-full p-2 border rounded"
                      value={formData.manualAddress}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block font-semibold mb-2">Payment Method</label>
                    <select
                      name="paymentMethod"
                      className="w-full p-2 border rounded"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                    >
                      <option value="GCash">GCash</option>
                      <option value="Cash on Delivery">Cash on Delivery</option>
                    </select>
                  </div>
                </>
              )}

              {formData.purchaseType === "Dine In" && (
                <div className="mb-4">
                  <label className="block font-semibold mb-2">Payment Method</label>
                  <select
                    name="paymentMethod"
                    className="w-full p-2 border rounded"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                  >
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                  </select>
                </div>
              )}

              {formData.paymentMethod === "GCash" && (
                <div className="space-y-2">
                  <div className="bg-blue-50 p-4 rounded mb-2">
                    <p className="font-bold text-center">Send payment to:</p>
                    <p className="text-xl font-bold text-center">0999 503 1403</p>
                  </div>
                  <div className="mb-2">
                    <label className="block font-semibold mb-1">Your GCash Number</label>
                    <input
                      type="text"
                      name="gcashNumber"
                      placeholder="09123456789"
                      className="w-full p-2 border rounded"
                      value={formData.gcashNumber}
                      onChange={handleInputChange}
                      maxLength="11"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Proof of Payment</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full p-2 border rounded-md"
                      onChange={handleFileChange}
                    />
                  </div>
                  <button
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full"
                    onClick={handleProofUpload}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Uploading..." : "Upload Proof"}
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2">
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
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className={`w-full py-3 rounded-lg font-bold text-white ${
                isProcessing ? "bg-gray-400" : "bg-black hover:bg-gray-800"
              } transition`}
            >
              {isProcessing ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate("/menu")}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Browse Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
