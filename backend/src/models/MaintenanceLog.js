import mongoose from "mongoose";

const maintenanceLogSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // mechanic/owner id
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    cost: { type: Number },
    documents: [{ type: String }], // urls or file refs
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("MaintenanceLog", maintenanceLogSchema);
