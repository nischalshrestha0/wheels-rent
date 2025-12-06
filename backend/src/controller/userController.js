import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export const createUser = async (req, res) => {
  try {
    const { username, fullname, email, password, phone, role } = req.body;
    if (!email || !password || !fullname || !phone) {
      return res.status(400).json({ message: 'fullname, email, password and phone are required' });
    }

    // check duplicates
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) return res.status(409).json({ message: 'User with given email or phone already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      username: username || (email ? email.split('@')[0] : undefined),
      fullname,
      email,
      password: hashed,
      phone,
      role: role || 'renter',
    });

    const savedUser = await newUser.save();
    // avoid returning password
    const userSafe = savedUser.toObject();
    delete userSafe.password;

    res.status(201).json({ message: 'User created successfully', user: userSafe });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const viewUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const viewUser = async (req, res) => {
  try {
    const { id } = req.params;
    let user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id).select('-password');
    }
    if (!user) {
      user = await User.findOne({ user_id: id }).select('-password');
    }
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    // find by _id or user_id
    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    }
    if (!user) {
      user = await User.findOneAndUpdate({ user_id: id }, updates, { new: true }).select('-password');
    }
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ message: 'User updated', user });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await User.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await User.findOneAndDelete({ user_id: id });
    }
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    return res.json({ message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
