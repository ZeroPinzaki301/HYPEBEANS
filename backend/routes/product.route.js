import express from 'express';
import Product from '../models/Product.model.js';
import { Recipe, Ingredient } from '../models/Inventory.model.js'; // Using centralized inventory models
import { productUpload } from '../utils/multer.js';

const router = express.Router();

// Create Product Route with Recipe Handling
router.post("/create", productUpload.single("image"), async (req, res) => {
    const { name, price, description, productType, beverageType, ingredients } = req.body;
    const image = req.file ? `uploads/${req.file.filename}` : null;

    if (!name || !price || !description || !productType) {
        return res.status(400).json({ message: "Missing required fields." });
    }
    if (productType === "beverages" && !beverageType) {
        return res.status(400).json({ message: "Beverage type is required for beverages." });
    }
    if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({ message: "Ingredients must be provided as an array." });
    }

    try {
        // Process ingredients: Check existence or create new ones
        const ingredientRecords = await Promise.all(
            ingredients.map(async (ingredient) => {
                let existingIngredient = await Ingredient.findOne({ name: ingredient.name });

                if (!existingIngredient) {
                    existingIngredient = new Ingredient({
                        name: ingredient.name,
                        quantity: ingredient.quantity, // Initial stock
                        unit: ingredient.unit || "pcs"
                    });
                    await existingIngredient.save();
                }

                return { ingredient: existingIngredient._id, quantityRequired: ingredient.quantity };
            })
        );

        // Create recipe entry
        const newRecipe = new Recipe({
            product: null, // Will be linked after product creation
            ingredients: ingredientRecords
        });

        await newRecipe.save();

        // Create product and link recipe
        const newProduct = new Product({
            name, price, description, productType, beverageType, image, recipe: newRecipe._id
        });

        await newProduct.save();
        newRecipe.product = newProduct._id;
        await newRecipe.save();

        res.status(201).json({ message: "Product created successfully with recipe", product: newProduct });
    } catch (error) {
        console.error("Error creating product:", error);
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
