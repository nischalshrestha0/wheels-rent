import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Routes
import userRoutes from './routes/userRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use('/user', userRoutes);
app.use('/vehicle', vehicleRoutes);
app.use('/booking', bookingRoutes);

export default app;