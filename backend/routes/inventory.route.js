import express from "express";
import Ingredient from "../models/Ingredient.model.js";

const router = express.Router();

// 🥬 Get All Ingredients
router.get("/", async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
});

// 🥬 Get Ingredient by ID
router.get("/:id", async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ error: "Ingredient not found" });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
});

// 🥬 Check if Ingredient Exists
router.post("/check", async (req, res) => {
  const { name } = req.body;
  try {
    const ingredient = await Ingredient.findOne({ name });
    if (ingredient) {
      return res.json({ exists: true, ingredient });
    }
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ error: "Error checking ingredient" });
  }
});

// 🥬 Create New Ingredient
router.post("/create", async (req, res) => {
  const { name, quantity, unit } = req.body;
  try {
    const existingIngredient = await Ingredient.findOne({ name });
    if (existingIngredient) {
      return res.status(400).json({ error: "Ingredient already exists" });
    }

    const newIngredient = new Ingredient({ name, quantity, unit });
    await newIngredient.save();
    res.status(201).json(newIngredient);
  } catch (error) {
    res.status(400).json({ error: "Failed to add ingredient" });
  }
});

// 🥬 Update Ingredient
router.put("/:id", async (req, res) => {
  try {
    const { quantity, $inc } = req.body;
    let update = {};

    // Handle both direct updates and incremental updates
    if (typeof quantity !== 'undefined') {
      // Direct quantity update (replace existing value)
      update.quantity = quantity;
    } else if ($inc && typeof $inc.quantity !== 'undefined') {
      // Incremental update (add to existing value)
      update.$inc = { quantity: $inc.quantity };
    } else {
      return res.status(400).json({ error: "Invalid update operation" });
    }

    // Validate the quantity won't go negative
    if (update.quantity !== undefined && update.quantity < 0) {
      return res.status(400).json({ error: "Quantity cannot be negative" });
    }

    const updatedIngredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!updatedIngredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    res.json(updatedIngredient);
  } catch (error) {
    console.error("Error updating ingredient:", error);
    res.status(400).json({ error: "Failed to update ingredient" });
  }
});

// 🥬 Delete Ingredient
router.delete("/:id", async (req, res) => {
  try {
    const deletedIngredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!deletedIngredient) return res.status(404).json({ error: "Ingredient not found" });
    res.json({ message: "Ingredient deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
});

export default router;
