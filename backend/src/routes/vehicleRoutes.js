import express from "express";
import auth from "../middleware/auth.js";
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  checkAvailability,
} from "../controller/vehicleController.js";

const router = express.Router();

router.get("/", getAllVehicles);
router.get("/:id", getVehicleById);
router.post("/", auth, createVehicle);
router.put("/:id", auth, updateVehicle);
router.delete("/:id", auth, deleteVehicle);
router.post("/:id/check-availability", checkAvailability);

export default router;
