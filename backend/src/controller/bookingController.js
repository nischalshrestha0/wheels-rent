import Booking from "../models/Booking.js";
import Vehicle from "../models/Vehicle.js";

// Create booking
export const createBooking = async (req, res) => {
  try {
    const { vehicleId, booking_start_date, booking_end_date, total_price } = req.body;

    if (!vehicleId || !booking_start_date || !booking_end_date || !total_price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newBooking = await Booking.createBooking({
      vehicleId,
      renterId: req.userId,
      startDate: booking_start_date,
      endDate: booking_end_date,
      totalPrice: total_price,
    });

    res.status(201).json({ message: "Booking created successfully", booking: newBooking });
  } catch (error) {
    res.status(400).json({ message: "Error creating booking", error: error.message });
  }
};

// Get all bookings for user
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.userId })
      .populate("vehicle")
      .populate("renter", "fullname email");
    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("vehicle")
      .populate("renter", "fullname email");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking", error: error.message });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Booking status updated", booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating booking", error: error.message });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, transactionId, method } = req.body;

    if (!["unpaid", "paid", "refunded", "partial"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        "payment.status": paymentStatus,
        "payment.transaction_id": transactionId,
        "payment.method": method,
        "payment.paidAt": paymentStatus === "paid" ? new Date() : null,
      },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Payment status updated", booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating payment", error: error.message });
  }
};
