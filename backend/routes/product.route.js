import express from 'express';
import Product from '../models/Product.model.js';
import Ingredient from '../models/Ingredient.model.js';
import { productUpload } from '../utils/multer.js';

const router = express.Router();

// Create Product Route
router.post("/create", productUpload.single("image"), async (req, res) => {
  try {
    // Parse body from FormData
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const {
      name,
      price,
      description,
      productType,
      beverageType,
      ingredients
    } = body;

    const image = req.file ? `uploads/${req.file.filename}` : null;

    if (!name || !price || !description || !productType) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (productType === "beverages" && !beverageType) {
      return res.status(400).json({ message: "Beverage type is required for beverages." });
    }

    // Parse and format ingredients
    let parsedIngredients = [];
    if (ingredients) {
      const rawIngredients = typeof ingredients === 'string'
        ? JSON.parse(ingredients)
        : ingredients;

      if (Array.isArray(rawIngredients)) {
        parsedIngredients = await Promise.all(rawIngredients.map(async (ing) => ({
          ingredient: ing.ingredient || ing, // either _id or object with .ingredient
          quantityRequired: Number(ing.quantityRequired)
        })));
      }
    }

    const newProduct = new Product({
      name,
      price,
      description,
      productType,
      beverageType,
      image,
      ingredients: parsedIngredients
    });

    await newProduct.save();
    res.status(201).json({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
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

    const body = req.body;

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
      const rawIngredients = typeof body.ingredients === 'string'
        ? JSON.parse(body.ingredients)
        : body.ingredients;

      if (Array.isArray(rawIngredients)) {
        product.ingredients = await Promise.all(rawIngredients.map(async (ing) => ({
          ingredient: ing.ingredient || ing,
          quantityRequired: Number(ing.quantityRequired)
        })));
      }
    }

    const updatedProduct = await product.save();
    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
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
    const products = await Product.find().populate("ingredients.ingredient"); // optional
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

// Add Existing Ingredient to Product Route
router.put("/add-ingredient/:id", async (req, res) => {
  try {
    const { ingredientId, quantityRequired } = req.body;

    // Ensure required fields are provided
    if (!ingredientId || !quantityRequired) {
      return res.status(400).json({ message: "Missing ingredient ID or quantity required." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const ingredient = await Ingredient.findById(ingredientId);
    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found." });
    }

    // Check if ingredient is already in the product's ingredients list
    const existingIngredient = product.ingredients.find(
      (ing) => ing.ingredient.toString() === ingredientId
    );

    if (existingIngredient) {
      return res.status(400).json({ message: "Ingredient already exists in the product." });
    }

    // Add new ingredient to the product
    product.ingredients.push({ ingredient: ingredientId, quantityRequired });

    const updatedProduct = await product.save();

    res.status(200).json({ message: "Ingredient added successfully", product: updatedProduct });
  } catch (error) {
    console.error("Error adding ingredient:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Remove an ingredient from a product 
router.put("/remove-ingredient/:id", async (req, res) => {
  try {
    const { ingredientId } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    
    product.ingredients = product.ingredients.filter(
      ing => ing.ingredient.toString() !== ingredientId
    );
    
    await product.save();
    res.status(200).json({ message: "Ingredient removed successfully", product });
  } catch (error) {
    console.error("Error removing ingredient:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

export default router;
