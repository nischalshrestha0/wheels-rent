import express from "express";
import auth from "../middleware/auth.js";
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
} from "../controller/bookingController.js";

const router = express.Router();

router.post("/", auth, createBooking);
router.get("/user/bookings", auth, getUserBookings);
router.get("/:id", getBookingById);
router.put("/:id/status", auth, updateBookingStatus);
router.put("/:id/payment", auth, updatePaymentStatus);

export default router;
