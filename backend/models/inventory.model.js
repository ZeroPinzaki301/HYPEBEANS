import mongoose from "mongoose";

// Ingredient Schema - Tracks raw materials
const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  quantity: { type: Number, default: 0 }, // Measured in grams, liters, or pieces
  unit: { type: String, enum: ["g", "ml", "pcs"], required: true },
  supplier: { type: String },
  lowStockThreshold: { type: Number, default: 10 }, // Configurable alert threshold
}, { timestamps: true });

const Ingredient = mongoose.model("Ingredient", ingredientSchema);

// Recipe Schema - Defines how much of each ingredient is needed per product
const recipeSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  ingredients: [{
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
    quantityRequired: { type: Number, required: true }
  }]
}, { timestamps: true });

const Recipe = mongoose.model("Recipe", recipeSchema);

export { Ingredient, Recipe };
