import express from "express";
import { paymentProofUpload } from "../utils/multer.js"; // Import the new upload utility
import PaymentProof from "../models/Payment.model.js";

const router = express.Router();

// Route to upload payment proof
router.post("/upload", paymentProofUpload.single("proofImage"), async (req, res) => {
  try {
    const { userId, gcashNumber } = req.body;

    if (!userId || !gcashNumber) {
      return res.status(400).json({ 
        message: "User ID and GCash number are required." 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        message: "No file uploaded or invalid file type." 
      });
    }

    const newProof = new PaymentProof({
      userId,
      gcashNumber,
      proofImage: `uploads/payment-proofs/${req.file.filename}`, // Consistent path format
    });

    await newProof.save();

    res.status(201).json({ 
      message: "Payment proof uploaded successfully.",
      imagePath: newProof.proofImage
    });
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    res.status(500).json({ 
      message: error.message || "Server error. Please try again." 
    });
  }
});

// Keep your existing GET /all route
router.get("/all", async (req, res) => {
  try {
    const proofs = await PaymentProof.find().populate("userId", "name email");
    res.status(200).json(proofs);
  } catch (error) {
    console.error("Error fetching payment proofs:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

export default router;
