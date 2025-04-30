import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  quantity: { type: Number, default: 0 }, // Measured in grams, liters, or pieces
  unit: { type: String, enum: ["g", "ml", "pcs"], required: true },
}, { timestamps: true });

const Ingredient = mongoose.model("Ingredient", ingredientSchema);

export default Ingredient;
