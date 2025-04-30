import express from "express";
import { Ingredient } from "../models/Inventory.model.js"; // Removed Recipe import

const router = express.Router();

// 🥬 Ingredient Routes
router.get("/ingredients", async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
});

router.get("/ingredients/:id", async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ error: "Ingredient not found" });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
});

router.post("/ingredients", async (req, res) => {
  try {
    const newIngredient = new Ingredient(req.body);
    await newIngredient.save();
    res.status(201).json(newIngredient);
  } catch (error) {
    res.status(400).json({ error: "Failed to add ingredient" });
  }
});

router.put("/ingredients/:id", async (req, res) => {
  try {
    const updatedIngredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedIngredient) return res.status(404).json({ error: "Ingredient not found" });
    res.json(updatedIngredient);
  } catch (error) {
    res.status(400).json({ error: "Failed to update ingredient" });
  }
});

router.delete("/ingredients/:id", async (req, res) => {
  try {
    const deletedIngredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!deletedIngredient) return res.status(404).json({ error: "Ingredient not found" });
    res.json({ message: "Ingredient deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
});

export default router;
