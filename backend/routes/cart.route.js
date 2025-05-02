import express from "express";
import Cart from "../models/Cart.model.js";

const router = express.Router();

// Add item to cart (only active cart)
router.post("/add", async (req, res) => {
    const { userId, productId, quantity, price } = req.body;
    
    try {
        let cart = await Cart.findOne({ user: userId, isActive: true });
        if (!cart) {
            cart = new Cart({ 
                user: userId, 
                items: [],
                isActive: true 
            });
        }

        const existingItem = cart.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product: productId, quantity, price });
        }

        await cart.save();
        res.status(200).json({ 
            success: true,
            message: "Item added to cart", 
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server Error", 
            error: error.message 
        });
    }
});

// Update cart item quantity (only active cart)
router.put("/update/:userId/:productId", async (req, res) => {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    try {
        const cart = await Cart.findOne({ user: userId, isActive: true });
        if (!cart) {
            return res.status(404).json({ 
                success: false,
                message: "Active cart not found" 
            });
        }

        const item = cart.items.find(item => item.product.toString() === productId);
        if (!item) {
            return res.status(404).json({ 
                success: false,
                message: "Item not found in cart" 
            });
        }

        item.quantity = quantity;
        await cart.save();
        res.status(200).json({ 
            success: true,
            message: "Quantity updated", 
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server Error", 
            error: error.message 
        });
    }
});

// Remove item from cart (only active cart)
router.delete("/remove/:userId/:productId", async (req, res) => {
    const { userId, productId } = req.params;

    try {
        const cart = await Cart.findOne({ user: userId, isActive: true });
        if (!cart) {
            return res.status(404).json({ 
                success: false,
                message: "Active cart not found" 
            });
        }

        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();
        res.status(200).json({ 
            success: true,
            message: "Item removed from cart", 
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server Error", 
            error: error.message 
        });
    }
});

// Get active cart items for a user
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const cart = await Cart.findOne({ user: userId, isActive: true })
            .populate("items.product");
            
        if (!cart) {
            return res.status(404).json({ 
                success: false,
                message: "No active cart found" 
            });
        }

        res.status(200).json({ 
            success: true,
            cart 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server Error", 
            error: error.message 
        });
    }
});

// Get cart history (inactive carts)
router.get("/history/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const carts = await Cart.find({ 
            user: userId, 
            isActive: false 
        })
        .populate("items.product")
        .sort({ updatedAt: -1 });

        res.status(200).json({ 
            success: true,
            carts 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server Error", 
            error: error.message 
        });
    }
});

// Reorder from historical cart
router.post("/reorder/:userId/:cartId", async (req, res) => {
    const { userId, cartId } = req.params;

    try {
        // 1. Find the inactive historical cart
        const oldCart = await Cart.findOne({
            _id: cartId,
            user: userId,
            isActive: false
        }).populate("items.product");

        if (!oldCart) {
            return res.status(404).json({ 
                success: false,
                message: "Cart not found or already active" 
            });
        }

        // 2. Find or create active cart
        let activeCart = await Cart.findOne({ user: userId, isActive: true });
        if (!activeCart) {
            activeCart = new Cart({ user: userId, items: [], isActive: true });
        }

        // 3. Add items to active cart (merge quantities if exists)
        let addedItems = 0;
        oldCart.items.forEach(oldItem => {
            const existingItem = activeCart.items.find(item => 
                item.product.toString() === oldItem.product._id.toString()
            );

            if (existingItem) {
                existingItem.quantity += oldItem.quantity;
            } else {
                activeCart.items.push({
                    product: oldItem.product._id,
                    quantity: oldItem.quantity,
                    price: oldItem.price
                });
            }
            addedItems++;
        });

        await activeCart.save();

        res.status(200).json({ 
            success: true,
            message: `${addedItems} items added to cart`,
            cart: activeCart
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Server Error", 
            error: error.message 
        });
    }
});

// Clear Cart
router.delete("/clear/:userId", async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.params.userId, isActive: true });
    res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
});

export default router;
