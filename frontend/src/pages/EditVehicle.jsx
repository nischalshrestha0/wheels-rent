import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VehicleForm from '../components/VehicleForm';
import api from '../utils/api';
import { useNotification } from '../hooks/useNotification';

const EditVehicle = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { addNotification } = useNotification();

	const [vehicle, setVehicle] = useState(null);
	const [loadingVehicle, setLoadingVehicle] = useState(true);

	useEffect(() => {
		const fetchVehicle = async () => {
			if (!id) {
				setLoadingVehicle(false);
				return;
			}
			try {
				setLoadingVehicle(true);
				const res = await api.get(`/vehicle/${id}`);
				const data = res.data?.vehicle || res.data || null;
				if (!data) {
					addNotification('Vehicle not found', 'error');
					setVehicle(null);
				} else {
					setVehicle(data);
				}
			} catch (err) {
				console.error('Failed to load vehicle:', err);
				addNotification('Failed to load vehicle details', 'error');
				setVehicle(null);
			} finally {
				setLoadingVehicle(false);
			}
		};

		fetchVehicle();
	}, [id, addNotification]);

	if (loadingVehicle) {
		return (
			<>
				<Header />
				<div className="min-h-screen flex items-center justify-center">
					<p>Loading vehicle details...</p>
				</div>
				<Footer />
			</>
		);
	}

	if (!vehicle) {
		return (
			<>
				<Header />
				<div className="min-h-screen flex items-center justify-center">
					<p>Vehicle not found or could not be loaded.</p>
				</div>
				<Footer />
			</>
		);
	}

	// handle submit: always use FormData for update (to support images and all fields)
	const handleSubmit = async (formData, { existingUrls, newFiles }) => {
		try {
			// Always send FormData for PUT (backend supports both)
			const token = localStorage.getItem('token');
			const config = {
				headers: {
					'Content-Type': 'multipart/form-data',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
			};
			await api.put(`/vehicle/${id}`, formData, config);

			addNotification('Vehicle updated successfully', 'success');
			navigate(`/vehicle/${id}`);
		} catch (err) {
			console.error('Update error:', err);
			addNotification(err.response?.data?.message || 'Failed to update vehicle', 'error');
		}
	};

	return (
		<>
			<Header />
			{/* Styled card like Add Vehicle */}
			<div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-start justify-center py-10">
				<div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl px-6 py-8">
					<VehicleForm vehicle={vehicle} mode="edit" showTitle={true} onSubmit={handleSubmit} />
				</div>
			</div>
			<Footer />
		</>
	);
};

export default EditVehicle;
