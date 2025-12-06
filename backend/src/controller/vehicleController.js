import Vehicle from "../models/Vehicle.js";

// Get all vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("owner", "fullname email");
    res.status(200).json({ vehicles });
  } catch (error) {
    res.status(500).json({ message: "Error fetching vehicles", error: error.message });
  }
};

// Get vehicle by ID
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id)
      .populate("owner", "fullname email")
      .populate("bookings");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(200).json({ vehicle });
  } catch (error) {
    res.status(500).json({ message: "Error fetching vehicle", error: error.message });
  }
};

// Create vehicle
export const createVehicle = async (req, res) => {
  try {
    const { title, description, vehicle_type, brand, price_per_hour, location, plate_number, image } = req.body;

    if (!title || !description || !vehicle_type || !brand || !price_per_hour || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newVehicle = new Vehicle({
      owner: req.userId,
      title,
      description,
      vehicle_type,
      brand,
      price_per_hour,
      location,
      plate_number,
      image: image || [],
    });

    await newVehicle.save();
    res.status(201).json({ message: "Vehicle created successfully", vehicle: newVehicle });
  } catch (error) {
    res.status(500).json({ message: "Error creating vehicle", error: error.message });
  }
};

// Update vehicle
export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(id, updates, { new: true });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.status(200).json({ message: "Vehicle updated", vehicle });
  } catch (error) {
    res.status(500).json({ message: "Error updating vehicle", error: error.message });
  }
};

// Delete vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.status(200).json({ message: "Vehicle deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting vehicle", error: error.message });
  }
};

// Check availability
export const checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const isAvailable = vehicle.isAvailable(startDate, endDate);
    res.status(200).json({ available: isAvailable, bookedDates: vehicle.getBookedDates() });
  } catch (error) {
    res.status(500).json({ message: "Error checking availability", error: error.message });
  }
};
