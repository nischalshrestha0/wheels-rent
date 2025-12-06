import mongoose from "mongoose";
const paymentSchema = new mongoose.Schema({
    booking: {
        type : mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required : true,
    },
    payer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    amount: {
        type: Number,
        required: true,
    },
    method: {
        type: String,
        enum: ["khalti", "cash", "card", "offline"],
        default: "khalti",
    },
    transaction_id: {
        type: String,
    },
    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending",
    },
    paid_at: {
        type: Date,
    },
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
