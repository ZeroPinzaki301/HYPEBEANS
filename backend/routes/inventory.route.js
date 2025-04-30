import express from "express";
import { Ingredient, Recipe } from "../models/Inventory.model.js";

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

// 📝 Recipe Routes
router.get("/recipes", async (req, res) => {
  try {
    const recipes = await Recipe.find().populate("ingredients.ingredient");
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

router.get("/recipes/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate("ingredients.ingredient");
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

router.post("/recipes", async (req, res) => {
  try {
    const newRecipe = new Recipe(req.body);
    await newRecipe.save();
    res.status(201).json(newRecipe);
  } catch (error) {
    res.status(400).json({ error: "Failed to add recipe" });
  }
});

router.put("/recipes/:id", async (req, res) => {
  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("ingredients.ingredient");
    if (!updatedRecipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(updatedRecipe);
  } catch (error) {
    res.status(400).json({ error: "Failed to update recipe" });
  }
});

router.delete("/recipes/:id", async (req, res) => {
  try {
    const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!deletedRecipe) return res.status(404).json({ error: "Recipe not found" });
    res.json({ message: "Recipe deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

export default router;
