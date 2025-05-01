import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
  change: { type: Number, required: true }, // Negative for deductions
  remaining: { type: Number, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  action: { type: String, enum: ["order_fulfillment", "manual_adjustment"] },
}, { timestamps: true });

export default mongoose.model("InventoryLog", inventoryLogSchema);
