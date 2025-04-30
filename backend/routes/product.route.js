import express from 'express';
import Product from '../models/Product.model.js';
import Ingredient from '../models/Ingredient.model.js';
import { productUpload } from '../utils/multer.js';

const router = express.Router();

// Create Product Route
router.post("/create", productUpload.single("image"), async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { name, price, description, productType, beverageType, ingredients } = body;
    const image = req.file ? `uploads/${req.file.filename}` : null;

    if (!name || !price || !description || !productType) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    let parsedIngredients = Array.isArray(ingredients)
      ? ingredients.map((ing) => ({
          ingredient: ing.ingredient, // Storing ObjectId directly
          quantityRequired: Number(ing.quantityRequired),
        }))
      : [];

    const newProduct = new Product({
      name,
      price,
      description,
      productType,
      beverageType,
      image,
      ingredients: parsedIngredients,
    });

    await newProduct.save();

    // Return populated ingredients for frontend display
    const populatedProduct = await Product.findById(newProduct._id).populate("ingredients.ingredient");

    res.status(201).json({ message: "Product created successfully", product: populatedProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


// Update/Edit Product Route
router.put("/update/:id", productUpload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Parse body from FormData if needed
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    product.name = body.name || product.name;
    product.price = body.price || product.price;
    product.description = body.description || product.description;
    product.productType = body.productType || product.productType;
    product.beverageType = body.beverageType || product.beverageType;

    if (req.file) {
      product.image = `uploads/${req.file.filename}`;
    }

    // Update ingredients if provided
    if (body.ingredients) {
      // Handle string or object format
      const rawIngredients = typeof body.ingredients === 'string'
        ? JSON.parse(body.ingredients)
        : body.ingredients;

      if (Array.isArray(rawIngredients)) {
        product.ingredients = rawIngredients.map(ing => ({
          ingredient: ing.ingredient, // This should be the ObjectId
          quantityRequired: Number(ing.quantityRequired)
        }));
      }
    }

    const updatedProduct = await product.save();
    
    // Return populated product
    const populatedProduct = await Product.findById(updatedProduct._id).populate("ingredients.ingredient");
    
    res.status(200).json({ 
      message: "Product updated successfully", 
      product: populatedProduct 
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


// Delete Product Route
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully", product: deletedProduct });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


// Get All Products Route
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("ingredients.ingredient");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


// Get Specific Product Route
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("ingredients.ingredient");

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
