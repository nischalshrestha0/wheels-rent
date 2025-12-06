import mongoose from "mongoose";

const rewardHistorySchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    points: { type: Number, default: 0 },
    type: { type: String, enum: ["earn", "spend", "royalty", "adjust"], default: "earn" },
    note: { type: String },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["renter", "owner", "admin"],
      default: "renter",
    },
    profile_picture: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // references to bookings made by this user
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    // reward points and history
    rewardPoints: {
      type: Number,
      default: 0,
    },
    rewardHistory: [rewardHistorySchema],
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
const User = mongoose.model("User", userSchema);

// Admin schema
const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    privileges: {
      type: String,
      enum: ["full", "limited"],
      required: true,
      default: "limited",
    },
  },
  { timestamps: true }
);
const Admin = mongoose.model("Admin", adminSchema);

// Owner schema
const ownerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    nid_number: {
      type: String,
    },
    nid_document: {
      type: String,
    },
    verified_status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);
const Owner = mongoose.model("Owner", ownerSchema);

// Renter schema
const renterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    license_number: {
      type: String,
    },
    licence_document: {
      type: String,
    },
    licence_type: [
      {
        type: String,
        enum: ["bike", "car"],
      },
    ],
  },
  { timestamps: true }
);
const Renter = mongoose.model("Renter", renterSchema);

// export models (ES module style)
export default User;
export { Admin, Owner, Renter };


