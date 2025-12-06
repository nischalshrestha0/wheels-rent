import mongoose from "mongoose";
import Vehicle from "./Vehicle.js";
import User from "./user.js";
import Payment from "./Payment.js";
import Coupon from "./Coupon.js";

const bookingSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  booking_start_date: {
    type: Date,
    required: true,
  },
  booking_end_date: {
    type: Date,
    required: true,
  },
  total_price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  payment: {
    status: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "partial"],
      default: "unpaid",
    },
    method: {
      type: String,
    },
    transaction_id: {
      type: String,
    },
    amount: {
      type: Number,
      default: 0,
    },
    paidAt: {
      type: Date,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure end date is after start date
bookingSchema.pre("validate", function (next) {
  if (this.booking_start_date && this.booking_end_date) {
    if (this.booking_end_date <= this.booking_start_date) {
      return next(
        new Error("booking_end_date must be after booking_start_date")
      );
    }
  }
  next();
});

// Review Schema
const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Static helper to create booking safely and update related docs
bookingSchema.statics.createBooking = async function ({
  vehicleId,
  renterId,
  startDate,
  endDate,
  totalPrice,
  couponCode = null,
  paymentInfo = null, // { status: 'paid'|'unpaid', method, transaction_id }
}) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // load vehicle and renter/owner
    const vehicle = await Vehicle.findById(vehicleId).session(session);
    if (!vehicle) throw new Error("Vehicle not found");

    const renter = await User.findById(renterId).session(session);
    if (!renter) throw new Error("Renter not found");

    const owner = await User.findById(vehicle.owner).session(session);
    if (!owner) throw new Error("Owner not found");

    // check availability
    if (!vehicle.isAvailable(startDate, endDate)) {
      throw new Error("Vehicle is not available for the selected dates");
    }

    // apply coupon if provided
    let appliedCoupon = null;
    let finalPrice = totalPrice;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, active: true })
        .session(session);
      if (!coupon) throw new Error("Invalid or expired coupon");
      // check min amount
      if (coupon.minAmount && totalPrice < coupon.minAmount) {
        throw new Error("Cart total does not meet coupon minimum amount");
      }
      // check usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new Error("Coupon usage limit reached");
      }
      // calculate discount
      if (coupon.type === "percent") {
        finalPrice = totalPrice - (totalPrice * coupon.value) / 100;
      } else {
        finalPrice = totalPrice - coupon.value;
      }
      if (finalPrice < 0) finalPrice = 0;
      appliedCoupon = coupon;
    }

    // create booking
    const bookingDocs = await this.create(
      [
        {
          vehicle: vehicleId,
          renter: renterId,
          booking_start_date: startDate,
          booking_end_date: endDate,
          total_price: finalPrice,
          status:
            paymentInfo && paymentInfo.status === "paid" ? "confirmed" : "pending",
          payment: paymentInfo || undefined,
        },
      ],
      { session }
    );
    const newBooking = bookingDocs[0];

    // create payment record (if paymentInfo provided or create pending)
    const paymentPayload = {
      booking: newBooking._id,
      amount: finalPrice,
      method: (paymentInfo && paymentInfo.method) || "offline",
      transaction_id: (paymentInfo && paymentInfo.transaction_id) || null,
      status:
        paymentInfo && (paymentInfo.status === "paid" || paymentInfo.status === "success")
          ? "success"
          : "pending",
      paid_at:
        paymentInfo && (paymentInfo.status === "paid" || paymentInfo.status === "success")
          ? new Date()
          : null,
    };
    const paymentDoc = await Payment.create([paymentPayload], { session });
    const newPayment = paymentDoc[0];

    // link payment to booking (keep local booking.payment as well)
    newBooking.payment = {
      status: paymentPayload.status === "success" ? "paid" : "unpaid",
      method: paymentPayload.method,
      transaction_id: paymentPayload.transaction_id,
      amount: paymentPayload.amount,
      paidAt: paymentPayload.paid_at,
    };
    if (paymentPayload.status === "success") {
      newBooking.status = "confirmed";
    }
    await newBooking.save({ session });

    // push availability entry and booking reference to vehicle
    vehicle.availability.push({
      bookedFrom: startDate,
      bookedTo: endDate,
      bookingId: newBooking._id,
    });
    if (!vehicle.bookings) vehicle.bookings = [];
    vehicle.bookings.push(newBooking._id);
    await vehicle.save({ session });

    // push booking ref to renter
    if (!renter.bookings) renter.bookings = [];
    renter.bookings.push(newBooking._id);

    // award reward points on successful payment only
    if (paymentPayload.status === "success") {
      const renterPoints = Math.floor(finalPrice / 10); // 1 point per 10 currency units
      renter.rewardPoints = (renter.rewardPoints || 0) + renterPoints;
      renter.rewardHistory = renter.rewardHistory || [];
      renter.rewardHistory.push({
        booking: newBooking._id,
        points: renterPoints,
        type: "earn",
        note: "Booking payment reward",
        date: new Date(),
      });

      const ownerRoyalty = Math.floor(finalPrice * 0.05); // 5% royalty as points
      owner.rewardPoints = (owner.rewardPoints || 0) + ownerRoyalty;
      owner.rewardHistory = owner.rewardHistory || [];
      owner.rewardHistory.push({
        booking: newBooking._id,
        points: ownerRoyalty,
        type: "royalty",
        note: "Owner royalty from booking",
        date: new Date(),
      });

      await owner.save({ session });
    }

    await renter.save({ session });

    // update coupon usage
    if (appliedCoupon) {
      appliedCoupon.usedCount = (appliedCoupon.usedCount || 0) + 1;
      // optionally deactivate if reached usageLimit
      if (appliedCoupon.usageLimit && appliedCoupon.usedCount >= appliedCoupon.usageLimit) {
        appliedCoupon.active = false;
      }
      await appliedCoupon.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // attach payment and coupon info to returned booking object
    const result = await this.findById(newBooking._id)
      .populate("vehicle")
      .populate("renter", "fullname email")
      .lean();

    result.paymentRecord = newPayment;
    if (appliedCoupon) result.couponApplied = { code: appliedCoupon.code, id: appliedCoupon._id };

    return result;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const Booking = mongoose.model("Booking", bookingSchema);
const Review = mongoose.model("Review", reviewSchema);

export default Booking;
export { Review };

