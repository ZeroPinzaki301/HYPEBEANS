import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [cart, setCart] = useState({ items: [] });
  const [variantData, setVariantData] = useState({});
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
        // 1. Fetch the current active cart
        const { data } = await axiosInstance.get(`/api/cart/${userId}`);
        
        if (!data?.success || !data.cart) {
          throw new Error("Failed to load cart data");
        }

        console.log("Fetched cart:", data.cart);
        setCart(data.cart);

        // 2. Load variant info from localStorage
        const cartVariants = JSON.parse(localStorage.getItem('cartVariants') || [];
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
        
        console.log("Variant data:", variantsMap);
        setVariantData(variantsMap);

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

    let subtotal = 0;
    const items = [];

    cart.items.forEach(item => {
      // Get variants for this product or use default
      const variants = variantData[item.product._id] || [{
        variant: 'hot', // Default variant
        price: item.price,
        quantity: item.quantity
      }];

      variants.forEach(variant => {
        const price = variant.price;
        const quantity = variant.quantity;
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

  const handleCheckout = async () => {
    try {
      setLoading(true);
      const { items } = calculateTotals();

      const orderData = {
        items, // This now includes variant information
        paymentMethod: formData.paymentMethod,
        purchaseType: formData.purchaseType,
        ...(formData.purchaseType === "Delivery" && {
          deliveryLocation: formData.gpsLocation,
          manualAddress: formData.manualAddress
        })
      };

      console.log("Submitting order:", orderData); // Debug log

      const response = await axiosInstance.post(`/api/orders/checkout/${userId}`, orderData);
      
      if (response.data.success) {
        // Clear cart and variants after successful checkout
        await axiosInstance.delete(`/api/cart/clear/${userId}`);
        localStorage.removeItem('cartVariants');
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
          {/* Order Summary - Now shows variants */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Your Order</h2>
            {cart.items.flatMap(item => {
              const variants = variantData[item.product._id] || [{
                variant: 'hot',
                price: item.price,
                quantity: item.quantity
              }];
              
              return variants.map((variant, index) => (
                <div key={`${item.product._id}-${index}`} className="flex justify-between py-2 border-b">
                  <span>
                    {item.product.name} ({variant.variant.toUpperCase()})
                  </span>
                  <span>
                    {variant.quantity} × ₱{variant.price.toFixed(2)}
                  </span>
                </div>
              ));
            })}
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

          {/* Checkout Form (unchanged) */}
          <div className="bg-white p-4 rounded shadow">
            {/* ... (keep your existing form code) ... */}
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
