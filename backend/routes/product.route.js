import express from 'express';
import Product from '../models/Product.model.js';
import { Recipe, Ingredient } from '../models/Inventory.model.js'; // Now using centralized inventory models
import { productUpload } from '../utils/multer.js';

const router = express.Router();

// Create Product Route
router.post("/create", productUpload.single("image"), async (req, res) => {
  try {
    // 1. Parse ingredients (fallback to empty array if missing)
    let ingredients = [];
    if (req.body.ingredients) {
      try {
        ingredients = JSON.parse(req.body.ingredients);
      } catch (e) {
        return res.status(400).json({ message: "Invalid ingredients format." });
      }
    }

    // 2. Ensure ingredients is an array
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ message: "Ingredients must be an array." });
    }

    // 3. Rest of your logic (create ingredients, recipe, product)
    const ingredientRecords = await Promise.all(
      ingredients.map(async (ingredient) => {
        // Your existing ingredient processing code
      })
    );

    // ... (continue with recipe and product creation)
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

  

// Update/Edit Product Route
router.put("/update/:id", productUpload.single("image"), async (req, res) => {
    const { name, price, description, productType, beverageType } = req.body;
  
    try {
      const product = await Product.findById(req.params.id);
  
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.productType = productType || product.productType;
      product.beverageType = beverageType || product.beverageType;
      if (req.file) {
        product.image = `uploads/${req.file.filename}`;
      }
  
      const updatedProduct = await product.save();
      res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });
  

// Delete Product Route
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
        const deletedProduct = await Product.findByIdAndDelete(id);
        if(!deletedProduct) return res.status(404).json({ message: "Product not found"});

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// Fetch/Get all the Product Route
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// Fetch Specific Product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
