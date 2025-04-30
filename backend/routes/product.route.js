import express from 'express';
import Product from '../models/Product.model.js';
import { Ingredient, Recipe } from '../models/Inventory.model.js';
import { productUpload } from '../utils/multer.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create Product with Ingredients
router.post("/create", productUpload.single("image"), async (req, res) => {
  const { name, price, description, productType, beverageType, ingredients } = req.body;
  const image = req.file ? `uploads/${req.file.filename}` : null;

  // Validate required fields
  if (!name || !price || !description || !productType) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (productType === "beverages" && !beverageType) {
    return res.status(400).json({ message: "Beverage type is required for beverages." });
  }

  try {
    // Process ingredients
    const ingredientRecords = [];
    const parsedIngredients = JSON.parse(ingredients);

    for (const ing of parsedIngredients) {
      // Check if ingredient exists
      let existingIngredient = await Ingredient.findOne({ name: ing.name });

      // If not exists, create new ingredient
      if (!existingIngredient) {
        existingIngredient = new Ingredient({
          name: ing.name,
          quantity: 0, // Start with 0 stock
          unit: ing.unit || 'g',
        });
        await existingIngredient.save();
      }

      ingredientRecords.push({
        ingredient: existingIngredient._id,
        quantityRequired: ing.quantity
      });
    }

    // Create recipe
    const newRecipe = new Recipe({
      ingredients: ingredientRecords
    });
    await newRecipe.save();

    // Create product
    const newProduct = new Product({
      name,
      price: parseFloat(price),
      description,
      productType,
      beverageType: productType === "beverages" ? beverageType : undefined,
      image,
      recipe: newRecipe._id
    });
    await newProduct.save();

    // Update recipe with product reference
    newRecipe.product = newProduct._id;
    await newRecipe.save();

    res.status(201).json({ 
      message: "Product created successfully",
      product: newProduct,
      recipe: newRecipe
    });

  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ 
      message: "Server Error", 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// ... (keep your other routes)
  

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
