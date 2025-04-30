import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String, required: true },
        image: { type: String },
        productType: { 
            type: String, 
            required: true, 
            enum: ["beverages", "delights"], // Restricting to specified types
            message: "Product type must be either 'beverages' or 'delights'"
        },
        variants: { // New field for variants
            hot: { price: { type: Number }, stock: { type: Number, default: 0 } },
            iced: { price: { type: Number }, stock: { type: Number, default: 0 } },
        },
        beverageType: {
            type: String,
            enum: [
              "espresso based",
              "coffee based frappe",
              "non-coffee based",
              "non-coffee based frappe",
              "refreshments",
              "cold brew specials",
            ],
        },
        recipe: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Recipe"
        }        
    },
    { timestamps: true }
);

export default mongoose.model("Product", productSchema);
