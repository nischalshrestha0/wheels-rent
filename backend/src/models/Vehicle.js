import mongoose from "mongoose";
import User from "./user.js";

const availabilitySchema = new mongoose.Schema({
  bookedFrom: {
    type: Date,
    required: true,
  },
  bookedTo: {
    type: Date,
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },
});

const maintenanceSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  maintenance_description: {
    type: String,
  },
  maintenance_start_date: {
    type: Date,
    required: true,
  },
  maintenance_end_date: {
    type: Date,
  },
});

const vehicleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  vehicle_type: {
    type: String,
    enum: ["car", "bike"],
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  price_per_hour: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  plate_number: {
    type: String,
  },
  image: [
    {
      url: { type: String, required: true },
      alt: { type: String, default: "VehicleImage" },
    },
  ],
  // list of blocked date ranges
  availability: [availabilitySchema],
  // references to Booking documents (helps queries)
  bookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
// Method to check if vehicle is available for date range
vehicleSchema.methods.isAvailable = function (startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return !this.availability.some((booking) => {
    const bStart = new Date(booking.bookedFrom);
    const bEnd = new Date(booking.bookedTo);

    // overlap logic
    return start < bEnd && end > bStart;
  });
};

// Method to get booked dates
vehicleSchema.methods.getBookedDates = function () {
  return this.availability.map((booking) => ({
    from: booking.bookedFrom,
    to: booking.bookedTo,
  }));
};

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

export default Vehicle;
export { Maintenance };
