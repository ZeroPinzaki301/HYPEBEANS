import express from 'express';
import Product from '../models/Product.model.js';
import { Ingredient } from '../models/Inventory.model.js';
import { productUpload } from '../utils/multer.js';
const router = express.Router();

// Create Product Route
router.post("/create", productUpload.single("image"), async (req, res) => {
    try {
        const { name, price, description, productType, beverageType } = req.body;
        
        // Parse ingredients from JSON string
        let ingredients = [];
        try {
            if (req.body.ingredients) {
                ingredients = JSON.parse(req.body.ingredients);
            }
        } catch (err) {
            return res.status(400).json({ message: "Invalid ingredients format. Please provide a valid JSON array." });
        }

        // Get image path if uploaded
        const image = req.file ? `uploads/${req.file.filename}` : null;
        
        // Validate required fields
        if (!name || !price || !description || !productType) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        
        if (productType === "beverages" && !beverageType) {
            return res.status(400).json({ message: "Beverage type is required for beverages." });
        }
        
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ message: "Ingredients must be provided as a non-empty array." });
        }

        // Process variants if provided
        const variants = {};
        
        if (req.body['variants[hot][price]']) {
            variants.hot = {
                price: parseFloat(req.body['variants[hot][price]']),
                stock: parseInt(req.body['variants[hot][stock]'] || 0)
            };
        }
        
        if (req.body['variants[iced][price]']) {
            variants.iced = {
                price: parseFloat(req.body['variants[iced][price]']),
                stock: parseInt(req.body['variants[iced][stock]'] || 0)
            };
        }

        // Ensure ingredients exist in the inventory, create if needed
        await Promise.all(ingredients.map(async (ingredient) => {
            let existingIngredient = await Ingredient.findOne({ name: ingredient.name });
            if (!existingIngredient) {
                existingIngredient = new Ingredient({
                    name: ingredient.name,
                    quantity: 0, // Start with 0 quantity
                    unit: ingredient.unit || "pcs"
                });
                await existingIngredient.save();
            }
        }));

        // Save product
        const newProduct = new Product({
            name,
            price: parseFloat(price),
            description,
            productType,
            beverageType: productType === "beverages" ? beverageType : undefined,
            image,
            ingredients: ingredients.map(ing => ({
                name: ing.name,
                quantity: parseFloat(ing.quantity),
                unit: ing.unit || "pcs"
            })),
            variants: Object.keys(variants).length > 0 ? variants : undefined
        });

        await newProduct.save();
        res.status(201).json({ message: "Product created successfully", product: newProduct });
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
