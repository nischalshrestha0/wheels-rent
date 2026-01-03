import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VehicleForm = ({ initialData, vehicle, isEdit = false, mode, onSubmit, loading = false }) => {
	const data = initialData || vehicle || null;
	const edit = isEdit || mode === 'edit';
	const navigate = useNavigate();

	// defaults
	const defaults = {
		name: '',
		brand: '',
		model: '',
		year: new Date().getFullYear(),
		type: 'car',
		color: '',
		registrationNumber: '',
		fuelType: 'petrol',
		transmission: 'manual',
		seatingCapacity: 5,
		mileage: 0,
		description: '',
		features: [],
		dailyRate: '',
		location: '',
		available: true,
		images: [], // can contain URL strings or File objects
	};

	const [formData, setFormData] = useState(defaults);
	const [featureInput, setFeatureInput] = useState('');
	const [imagePreviews, setImagePreviews] = useState([]);

	// Helper: build preview URL for existing stored image
	const toPreviewUrl = (img) => {
		if (!img) return '';
		if (typeof img === 'string') {
			if (/^https?:\/\//i.test(img)) return img;
			if (img.startsWith('/uploads')) return `/api${img}`; // proxied path
			if (img.startsWith('uploads')) return `/api/${img.replace(/^\/+/, '')}`;
			// fallback: assume filename under uploads
			return `/api/uploads/${img}`;
		}
		// File object -> object URL
		return URL.createObjectURL(img);
	};

	// Map backend vehicle object to form shape
	const mapVehicleToForm = (veh) => {
		if (!veh) return defaults;

		// robust registration number fallback keys (includes plate_number)
		const registrationNumber =
			veh.registration_number ??
			veh.reg_no ??
			veh.regNumber ??
			veh.regNum ??
			veh.registration ??
			veh.plate_number ??
			veh.plate ??
			veh.registrationNumber ??
			veh.number_plate ??
			veh.license_plate ??
			veh.regNo ??
			'';

		return {
			name: veh.title || veh.name || '',
			brand: veh.brand || '',
			model: veh.model || '',
			year: veh.year || (veh.createdAt ? new Date(veh.createdAt).getFullYear() : new Date().getFullYear()),
			type: (veh.vehicle_type || veh.type || 'car').toLowerCase(),
			color: veh.color || '',
			registrationNumber: // use robust fallback
				veh.registration_number ??
				veh.reg_no ??
				veh.regNumber ??
				veh.regNum ??
				veh.registration ??
				veh.plate_number ??
				veh.plate ??
				veh.registrationNumber ??
				veh.number_plate ??
				veh.license_plate ??
				veh.regNo ??
				'',
			fuelType: (veh.fuel_type || veh.fuelType || 'petrol').toLowerCase(),
			transmission: (veh.transmission || veh.transmissionType || 'manual').toLowerCase(),
			seatingCapacity: veh.seating_capacity || veh.seatingCapacity || veh.seats || 5,
			mileage: veh.mileage || 0,
			description: veh.description || '',
			features: Array.isArray(veh.features) ? veh.features : (veh.features ? [veh.features] : []),
			dailyRate:
				veh.price_per_hour != null
					? Number(veh.price_per_hour) * 24
					: veh.dailyRate ?? veh.price_per_day ?? veh.pricePerDay ?? '',
			location: veh.location || '',
			available: typeof veh.available === 'boolean' ? veh.available : !!veh.available,
			images: Array.isArray(veh.images)
				? veh.images
				: Array.isArray(veh.image)
				? veh.image
				: veh.images
				? [veh.images]
				: [],
		};
	};

	// Sync when vehicle/initialData changes (prefill)
	useEffect(() => {
		if (!data) {
			setFormData(defaults);
			setImagePreviews([]);
			return;
		}
		const mapped = mapVehicleToForm(data);
		setFormData((prev) => ({ ...defaults, ...mapped }));
		// Build previews (strings or object URLs)
		const previews = (mapped.images || []).map((img) => toPreviewUrl(img));
		setImagePreviews(previews);
		// Also ensure formData.images contains URL strings for existing images so submit can send existingImages
		setFormData((prev) => ({ ...prev, images: [...(mapped.images || [])] }));
		// cleanup: revoke object URLs when component unmounts or data changes
		return () => {
			// revoke only blob/object URLs we created earlier (starts with blob:)
			previews.forEach((p) => {
				if (p && p.startsWith('blob:')) {
					try { URL.revokeObjectURL(p); } catch { /* ignore */ }
				}
			});
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	// Handle simple field changes
	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
	};

	const handleFeatureAdd = () => {
		const f = (featureInput || '').trim();
		if (!f) return;
		setFormData((prev) => ({ ...prev, features: [...(prev.features || []), f] }));
		setFeatureInput('');
	};

	const handleFeatureRemove = (feature) => {
		setFormData((prev) => ({ ...prev, features: prev.features.filter((x) => x !== feature) }));
	};

	// Upload new files: append File objects to formData.images and add preview (object URL)
	const handleImageUpload = (e) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;
		const valid = files.filter((f) => f.type && f.type.startsWith('image/'));
		if (valid.length !== files.length) {
			alert('Please select only image files');
		}
		const newPreviews = valid.map((f) => URL.createObjectURL(f));
		setImagePreviews((prev) => [...prev, ...newPreviews]);
		setFormData((prev) => ({ ...prev, images: [...(prev.images || []), ...valid] }));
		e.target.value = null;
	};

	// Remove image at index: remove both preview and corresponding entry in formData.images
	const handleImageRemove = (index) => {
		setImagePreviews((prev) => {
			const removed = prev[index];
			if (removed && removed.startsWith('blob:')) {
				try { URL.revokeObjectURL(removed); } catch { /* ignore */ }
			}
			return prev.filter((_, i) => i !== index);
		});
		setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
	};

	// Submit: onSubmit receives FormData (existing URLs passed as existingImages[], new files appended as images)
	const handleSubmit = (e) => {
		e.preventDefault();

		// basic validation
		if (!formData.name || !formData.brand || !formData.model || !formData.dailyRate || !formData.location) {
			alert('Please fill required fields: Name, Brand, Model, Daily Rate, Location');
			return;
		}
		if (!formData.registrationNumber) {
			alert('Registration Number is required');
			return;
		}
		// Registration number format (Nepal: e.g. "Ba 2 Cha 1234" or "GA-01-PA-1234")
		const regNum = String(formData.registrationNumber).trim().toUpperCase();
		const plateRegex = /^[A-Z0-9\- ]{4,}$/;
		if (!plateRegex.test(regNum)) {
			alert('Invalid registration number format (use letters, numbers, - or space)');
			return;
		}
		if (!edit && (!formData.images || formData.images.length === 0)) {
			alert('Please upload at least one image');
			return;
		}

		// Build FormData: separate existing URL strings and new File objects
		const imagesArray = Array.isArray(formData.images) ? formData.images : [];
		const existingUrls = imagesArray.filter((i) => typeof i === 'string');
		const newFiles = imagesArray.filter((i) => i instanceof File);

		const fd = new FormData();
		// owner info from localStorage if present — leave to page-level if needed
		fd.append('name', formData.name);
		fd.append('brand', formData.brand);
		fd.append('model', formData.model);
		fd.append('year', formData.year);
		fd.append('type', formData.type);
		fd.append('color', formData.color || '');
		fd.append('registrationNumber', formData.registrationNumber || '');
		fd.append('fuelType', formData.fuelType);
		fd.append('transmission', formData.transmission);
		fd.append('seatingCapacity', formData.seatingCapacity);
		fd.append('mileage', formData.mileage || 0);
		fd.append('description', formData.description || '');
		fd.append('dailyRate', formData.dailyRate || '');
		fd.append('location', formData.location || '');
		fd.append('available', formData.available ? 'true' : 'false');
		fd.append('features', JSON.stringify(formData.features || []));

		// existing image URLs to keep
		existingUrls.forEach((url) => fd.append('existingImages[]', url));

		// append new files
		newFiles.forEach((file) => fd.append('images', file));

		if (typeof onSubmit === 'function') onSubmit(fd, { existingUrls, newFiles });
	};

	// UI lists
	const categories = ['Car', 'Bike', 'Scooter', 'Truck', 'Bus'];
	const fuels = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
	const transmissions = ['Manual', 'Automatic'];
	const colors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Gray', 'Gold', 'Brown'];

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden">
			{/* Header */}
			<div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
				<div className="flex items-center gap-3 mb-2">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="text-white hover:bg-blue-500 p-1 rounded-lg transition-colors"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
					</button>
					<h1 className="text-2xl font-bold text-white">
						{edit ? 'Edit Vehicle' : 'Add New Vehicle'}
					</h1>
				</div>
				<p className="text-blue-100 text-sm">{edit ? 'Update' : 'Upload'} your vehicle information</p>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="p-6 space-y-6">
				{/* Basic Information */}
				<div className="border-b border-gray-200 pb-6">
					<h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Vehicle Name */}
						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Vehicle Name <span className="text-red-600">*</span>
							</label>
							<input
								type="text"
								name="name"
								value={formData.name}
								onChange={handleChange}
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							/>
						</div>

						{/* Category */}
						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Category <span className="text-red-600">*</span>
							</label>
							<select
								name="type"
								value={formData.type}
								onChange={handleChange}
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							>
								{categories.map((cat) => (
									<option key={cat} value={cat.toLowerCase()}>
										{cat}
									</option>
								))}
							</select>
						</div>

						{/* Brand */}
						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Brand <span className="text-red-600">*</span>
							</label>
							<input
								type="text"
								name="brand"
								value={formData.brand}
								onChange={handleChange}
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							/>
						</div>

						{/* Model */}
						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Model <span className="text-red-600">*</span>
							</label>
							<input
								type="text"
								name="model"
								value={formData.model}
								onChange={handleChange}
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							/>
						</div>

						{/* Year */}
						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Year <span className="text-red-600">*</span>
							</label>
							<input
								type="number"
								name="year"
								value={formData.year}
								onChange={handleChange}
								min="1990"
								max={new Date().getFullYear() + 1}
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							/>
						</div>

						{/* Color */}
						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Color
							</label>
							<select
								name="color"
								value={formData.color}
								onChange={handleChange}
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							>
								<option value="">Select Color</option>
								{colors.map((c) => (
									<option key={c} value={c.toLowerCase()}>
										{c}
									</option>
								))}
							</select>
						</div>

						{/* Registration Number */}
						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Registration Number <span className="text-red-600">*</span>
							</label>
							<input
								type="text"
								name="registrationNumber"
								value={formData.registrationNumber}
								onChange={handleChange}
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							/>
						</div>
					</div>

					{/* Description */}
					<div className="mt-4">
						<label className="block text-sm font-semibold text-gray-900 mb-2">
							Description
						</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleChange}
							rows={4}
							className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
						/>
					</div>
				</div>

				{/* Specifications */}
				<div className="border-b border-gray-200 pb-6">
					<h2 className="text-lg font-bold text-gray-900 mb-4">Specifications</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Fuel Type <span className="text-red-600">*</span>
							</label>
							<select
								name="fuelType"
								value={formData.fuelType}
								onChange={handleChange}
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							>
								{fuels.map((f) => (
									<option key={f} value={f.toLowerCase()}>
										{f}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Transmission <span className="text-red-600">*</span>
							</label>
							<select
								name="transmission"
								value={formData.transmission}
								onChange={handleChange}
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							>
								{transmissions.map((t) => (
									<option key={t} value={t.toLowerCase()}>
										{t}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Seating Capacity <span className="text-red-600">*</span>
							</label>
							<input
								type="number"
								name="seatingCapacity"
								value={formData.seatingCapacity}
								onChange={handleChange}
								min="1"
								max="20"
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Mileage (km)
							</label>
							<input
								type="number"
								name="mileage"
								value={formData.mileage}
								onChange={handleChange}
								min="0"
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							/>
						</div>
					</div>
				</div>

				{/* Features */}
				<div className="border-b border-gray-200 pb-6">
					<h2 className="text-lg font-bold text-gray-900 mb-4">Features</h2>
					<div className="flex gap-2 mb-3">
						<input
							type="text"
							value={featureInput}
							onChange={(e) => setFeatureInput(e.target.value)}
							placeholder="e.g., GPS Navigation, Backup Camera..."
							onKeyPress={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleFeatureAdd();
								}
							}}
							className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
						/>
						<button
							type="button"
							onClick={handleFeatureAdd}
							className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
						>
							Add
						</button>
					</div>

					<div className="flex flex-wrap gap-2">
						{(formData.features || []).map((feature, index) => (
							<div
								key={index}
								className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium"
							>
								{feature}
								<button
									type="button"
									onClick={() => handleFeatureRemove(feature)}
									className="text-blue-600 hover:text-blue-900 font-bold"
								>
									✕
								</button>
							</div>
						))}
					</div>
					{(formData.features || []).length === 0 && (
						<p className="text-gray-500 text-sm mt-2">Press Enter or click Add to add a feature</p>
					)}
				</div>

				{/* Pricing & Location */}
				<div className="border-b border-gray-200 pb-6">
					<h2 className="text-lg font-bold text-gray-900 mb-4">Pricing & Location</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Daily Rate (NPR) <span className="text-red-600">*</span>
							</label>
							<input
								type="number"
								name="dailyRate"
								value={formData.dailyRate}
								onChange={handleChange}
								required
								min="0"
								step="0.01"
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Location <span className="text-red-600">*</span>
							</label>
							<input
								type="text"
								name="location"
								value={formData.location}
								onChange={handleChange}
								required
								className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
							/>
						</div>
					</div>

					<div className="mt-4 flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
						<input
							type="checkbox"
							name="available"
							id="available"
							checked={formData.available}
							onChange={handleChange}
							className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
						/>
						<label htmlFor="available" className="text-sm font-medium text-gray-900">
							Make this vehicle available for booking
						</label>
					</div>
				</div>

				{/* Vehicle Images */}
				<div className="pb-6">
					<h2 className="text-lg font-bold text-gray-900 mb-4">
						Vehicle Images <span className="text-red-600">*</span>
					</h2>
					<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
						<input
							type="file"
							multiple
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
							id="imageUpload"
						/>
						<label htmlFor="imageUpload" className="cursor-pointer">
							<svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
								<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
							</svg>
							<p className="text-gray-700 font-semibold">Upload Image</p>
							<p className="text-gray-500 text-sm">Upload at least 1 high quality image of your vehicle</p>
						</label>
					</div>

					{/* Image Previews */}
					{(imagePreviews || []).length > 0 && (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
							{imagePreviews.map((preview, index) => (
								<div key={index} className="relative group">
									<img
										src={preview}
										alt={`Preview ${index + 1}`}
										className="w-full h-32 object-cover rounded-lg"
									/>
									<button
										type="button"
										onClick={() => handleImageRemove(index)}
										className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
											<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
										</svg>
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="flex gap-3 pt-6 border-t border-gray-200">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading}
						className={`flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg transition-all ${
							loading
								? 'opacity-50 cursor-not-allowed'
								: 'hover:bg-gray-800 active:scale-[0.98]'
						}`}
					>
						{loading ? (
							<span className="flex items-center justify-center gap-2">
								<svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
								{edit ? 'Updating...' : 'Adding...'}
							</span>
						) : edit ? (
							'Save Changes'
						) : (
							'Add Vehicle'
						)}
					</button>
				</div>
			</form>
		</div>
	);
};

export default VehicleForm;
