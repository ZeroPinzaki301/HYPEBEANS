import express from "express";
import Cart from "../models/Cart.model.js";

const router = express.Router();

// Add item to cart
router.post("/add", async (req, res) => {
  const { userId, productId, quantity, price, variant = "hot" } = req.body;
  
  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
  
    // Check if same product with same variant already exists
    const existingItem = cart.items.find(
      (item) => 
        item.product.toString() === productId && 
        item.variant === variant
    );
  
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = price; // Update price in case it changed
    } else {
      cart.items.push({ 
        product: productId, 
        quantity, 
        price,
        variant 
      });
    }
  
    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error("Error in /cart/add:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Update cart item quantity (modified to handle variants)
router.put("/update/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;
  const { quantity, variant = "hot" } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      (item) => 
        item.product.toString() === productId && 
        item.variant === variant
    );
    
    if (item) {
      item.quantity = quantity;
    } else {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await cart.save();
    res.status(200).json({ message: "Cart updated", cart });
  } catch (error) {
    console.error("Error in /cart/update:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Remove item from cart (modified to handle variants)
router.delete("/remove/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;
  const { variant = "hot" } = req.query; // Get variant from query params

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => 
        !(item.product.toString() === productId && item.variant === variant)
    );

    await cart.save();
    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Error in /cart/remove:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Get cart items for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error in /cart/:userId:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

export default router;
