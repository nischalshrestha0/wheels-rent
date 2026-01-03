import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNotification } from '../hooks/useNotification';
import api from '../utils/api';

const Home = () => {
	const navigate = useNavigate();
	const { addNotification } = useNotification();
	const [vehicles, setVehicles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState({
		category: 'all',
		location: '',
	});
	const [location, setLocation] = useState('');
	const [pickupDate, setPickupDate] = useState('');

	useEffect(() => {
		fetchVehicles();
	}, []);

	const fetchVehicles = async () => {
		try {
			console.log(' Fetching vehicles...');
			
			const response = await api.get('/vehicle');

			console.log(' Vehicles response:', response.data);

			const vehicleData = Array.isArray(response.data)
				? response.data
				: response.data.vehicles && Array.isArray(response.data.vehicles)
					? response.data.vehicles
					: [];

			setVehicles(vehicleData);
			console.log(`✓ Loaded ${vehicleData.length} vehicles`);
		} catch (error) {
			console.error('Error fetching vehicles:', error);
			console.error('Error details:', {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status
			});
			
			// Show notification instead of just logging
			if (error.response?.status === 500) {
				addNotification('Server error while loading vehicles. Showing sample data.', 'error');
			} else if (error.code === 'ERR_NETWORK') {
				addNotification('Cannot connect to server. Showing sample data.', 'error');
			}
			
			// Use mock data as fallback
			setVehicles([
				{
					_id: '1',
					name: 'Honda Civic 2021',
					brand: 'Honda',
					model: 'Civic',
					year: 2021,
					type: 'car',
					dailyRate: 2500,
					location: 'Kathmandu',
					available: true,
					images: [],
				},
				{
					_id: '2',
					name: 'Yamaha FZ 2020',
					brand: 'Yamaha',
					model: 'FZ',
					year: 2020,
					type: 'bike',
					dailyRate: 1500,
					location: 'Kathmandu',
					available: true,
					images: [],
				},
				{
					_id: '3',
					name: 'Toyota Fortuner 2022',
					brand: 'Toyota',
					model: 'Fortuner',
					year: 2022,
					type: 'car',
					dailyRate: 4000,
					location: 'Pokhara',
					available: true,
					images: [],
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	// Ensure vehicles is always an array before filtering
	const filteredVehicles = Array.isArray(vehicles)
		? vehicles.filter((v) => {
				// Only show available vehicles (status: 'available')
				if (v.status && v.status !== 'available') return false;
				if (v.available === false) return false;
				if (filters.category !== 'all' && v.type !== filters.category) return false;
				if (
					filters.location &&
					!v.location?.toLowerCase().includes(filters.location.toLowerCase())
				)
					return false;
				return true;
		  })
		: [];

	const onSearch = () => {
		navigate(
			`/vehicles?location=${encodeURIComponent(
				location
			)}&pickup=${encodeURIComponent(pickupDate)}`
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#f6f7ff] via-[#f7f8ff] to-white text-gray-900">
			<Header />

			{/* Hero */}
			<section className="relative overflow-hidden">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 grid md:grid-cols-2 gap-8 items-center">
					<div>
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 font-semibold">
							<span>Join 10,000+ Happy Users</span>
						</div>
						<h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
							Find Your Perfect Ride, Anytime
						</h1>
						<p className="mt-4 text-sm sm:text-base text-gray-600 max-w-xl">
							Rent any vehicle from trusted owners in your area. From bikes to cars,
							find the perfect vehicle for your journey with secure payments and
							24/7 support.
						</p>

						{/* Stats */}
						<div className="mt-6 flex flex-wrap gap-6 text-sm">
							<div>
								<p className="text-2xl font-bold">5000+</p>
								<p className="text-gray-500">Vehicles</p>
							</div>
							<div>
								<p className="text-2xl font-bold">50+</p>
								<p className="text-gray-500">Cities</p>
							</div>
							<div>
								<p className="text-2xl font-bold">4.8★</p>
								<p className="text-gray-500">Rating</p>
							</div>
						</div>

						{/* Search card */}
						<div className="mt-6 bg-white shadow-lg border border-gray-200 rounded-xl p-4 w-full max-w-lg">
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
								<div className="sm:col-span-1">
									<label className="text-xs font-semibold text-gray-600">
										Location
									</label>
									<div className="mt-1 relative">
										<input
											value={location}
											onChange={(e) => setLocation(e.target.value)}
											placeholder="Where do you need a vehicle?"
											className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-indigo-100"
										/>
										<span className="absolute right-3 top-2.5 text-gray-400">
											
										</span>
									</div>
								</div>
								<div className="sm:col-span-1">
									<label className="text-xs font-semibold text-gray-600">
										Pick-up Date
									</label>
									<div className="mt-1 relative">
										<input
											type="date"
											value={pickupDate}
											onChange={(e) => setPickupDate(e.target.value)}
											className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-indigo-100"
										/>
										<span className="absolute right-3 top-2.5 text-gray-400">
											
										</span>
									</div>
								</div>
								<div className="sm:col-span-1">
									<button
										onClick={onSearch}
										className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
									>
										Search Vehicles
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Hero Image */}
					<div className="relative">
						<div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200">
							<img
								src="./src/assets/Container.png"
								// src="https://images.unsplash.com/photo-1573918069081-41b07165a62d?q=80&w=1200&auto=format&fit=crop"
								alt="WheelsRent Hero"
								className="w-full h-[360px] object-cover"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Features */}
			<section id="features" className="py-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="w-full flex items-center justify-center">
						<span className="px-2 py-1 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-semibold">
							Features
						</span>
					</div>
					<h2 className="mt-2 text-center text-2xl font-bold">
						Why Choose WheelsRent?
					</h2>
					<p className="text-center text-sm text-gray-600 mt-2">
						Experience hassle-free vehicle rentals with our comprehensive platform
						designed for your convenience
					</p>
					<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{
							[
								{
									icon: '',
									title: 'Verified Owners',
									desc: 'All vehicle owners undergo rigorous KYC and document verification for your safety.',
								},
								{
									icon: '💳',
									title: 'Secure Payments',
									desc: 'Safe and instant transactions via Khalti Payment Gateway with buyer protection.',
								},
								{
									icon: '',
									title: 'Loyalty Rewards',
									desc: 'Earn points on every booking and referral. Unlock exclusive benefits and discounts.',
								},
								{
									icon: '🚗',
									title: 'Wide Selection',
									desc: 'Choose from bikes, cars, SUVs, and commercial vehicles to match your needs.',
								},
								{
									icon: '',
									title: '24/7 Support',
									desc: 'Round-the-clock customer support via chat, email, and SMS notifications.',
								},
								{
									icon: '',
									title: 'Real-time Chat',
									desc: 'Connect instantly with vehicle owners through our built-in messaging system.',
								},
								{
									icon: '',
									title: 'Location-Based',
									desc: 'Find vehicles near you with integrated map view and distance filters.',
								},
								{
									icon: '⭐',
									title: 'Gold Membership',
									desc: 'Exclusive perks, priority booking, and special rates for premium members.',
								},
							].map((f) => (
								<div
									key={f.title}
									className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
								>
									<div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 grid place-items-center text-lg">
										{f.icon}
									</div>
									<p className="mt-3 font-semibold">{f.title}</p>
									<p className="mt-1 text-sm text-gray-600">{f.desc}</p>
								</div>
							))
						}
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section
				id="process"
				className="py-10 bg-gradient-to-b from-white to-[#f7f8fa]"
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="w-full flex items-center justify-center">
						<span className="px-2 py-1 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-semibold">
							Process
						</span>
					</div>
					<h2 className="mt-2 text-center text-2xl font-bold">How It Works</h2>
					<p className="text-center text-sm text-gray-600 mt-2">
						Get started in just three simple steps
					</p>
					<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
						{
							[
								{
									step: 1,
									title: 'Search & Browse',
									desc: 'Enter your location and dates to discover available vehicles. Filter by type, price, and features to find your perfect match.',
								},
								{
									step: 2,
									title: 'Book & Confirm',
									desc: 'Select your vehicle, check availability on the calendar, and send a booking request. Owner confirms and you’re ready to go!',
								},
								{
									step: 3,
									title: 'Drive & Enjoy',
									desc: 'Make secure payment via Khalti, pick up your vehicle, and hit the road. Return on time and earn loyalty points!',
								},
							].map((s) => (
								<div
									key={s.step}
									className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
								>
									<div className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center font-bold">
										{s.step}
									</div>
									<p className="mt-3 font-semibold">{s.title}</p>
									<p className="mt-1 text-sm text-gray-600">{s.desc}</p>
								</div>
							))
						}
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section id="testimonials" className="py-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="w-full flex items-center justify-center">
						<span className="px-2 py-1 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-semibold">
							Testimonials
						</span>
					</div>
					<h2 className="mt-2 text-center text-2xl font-bold">
						What Our Users Say
					</h2>
					<p className="text-center text-sm text-gray-600 mt-2">
						Join thousands of satisfied renters and vehicle owners
					</p>
					<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
						{
							[
								{
									name: 'Rajesh Kumar',
									role: 'Renter',
									text: "WheelsRent made it so easy to rent a car for my weekend trip. The owner was verified, the car was in perfect condition, and the payment process was seamless!",
								},
								{
									name: 'Priya Sharma',
									role: 'Vehicle Owner',
									text: "As a vehicle owner, I love how WheelsRent handles everything - from verification to payments. I’ve earned great passive income while my bike sits idle!",
								},
								{
									name: 'Anil Shrestha',
									role: 'Gold Member',
									text: "The loyalty program is fantastic! I’ve earned so many points that I got my last rental almost free. Plus, the customer support is always responsive.",
								},
							].map((t) => (
								<div
									key={t.name}
									className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
								>
									<div className="flex items-center gap-2 text-yellow-500">
										★★★★★
									</div>
									<p className="mt-2 text-sm text-gray-700">{t.text}</p>
									<div className="mt-3 flex items-center gap-3">
										<div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-xs font-bold">
											{t.name.split(' ').map((x) => x[0]).join('')}
										</div>
										<div>
											<p className="text-sm font-semibold">{t.name}</p>
											<p className="text-xs text-gray-500">{t.role}</p>
										</div>
									</div>
								</div>
							))
						}
					</div>
				</div>
			</section>

			{/* Stats Banner */}
			<section className="py-10 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
					<div>
						<p className="text-3xl font-extrabold">10K+</p>
						<p className="text-white/80 text-sm">Active Users</p>
					</div>
					<div>
						<p className="text-3xl font-extrabold">5K+</p>
						<p className="text-white/80 text-sm">Vehicles Listed</p>
					</div>
					<div>
						<p className="text-3xl font-extrabold">25K+</p>
						<p className="text-white/80 text-sm">Bookings Completed</p>
					</div>
					<div>
						<p className="text-3xl font-extrabold">50+</p>
						<p className="text-white/80 text-sm">Cities Covered</p>
					</div>
				</div>
			</section>


			{/* Footer */}
			<footer className="bg-[#0f172a] text-gray-300">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-4 gap-8">
					<div>
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-lg bg-indigo-600 grid place-items-center text-white">
								🚗
							</div>
							<span className="font-semibold text-white">WheelsRent</span>
						</div>
						<p className="mt-3 text-sm opacity-80">
							Your trusted vehicle rental marketplace connecting owners and renters
							across the nation.
						</p>
						<div className="mt-3 flex items-center gap-3 text-white/70 text-lg">
							<span></span>
							<span>▶</span>
							<span>☆</span>
						</div>
					</div>
					<div>
						<p className="font-semibold text-white">Company</p>
						<ul className="mt-2 text-sm space-y-2 opacity-80">
							<li>About Us</li>
							<li>How it Works</li>📦
							<li>Careers</li>
							<li>Contact</li>
						</ul>
					</div>
					<div>
						<p className="font-semibold text-white">Support</p>
						<ul className="mt-2 text-sm space-y-2 opacity-80">
							<li>Help Center</li>
							<li>Safety Guidelines</li>
							<li>Terms of Service</li>
							<li>Privacy Policy</li>
						</ul>
					</div>
					<div>
						<p className="font-semibold text-white">Get Started</p>
						<ul className="mt-2 text-sm space-y-2 opacity-80">
							<li>Rent a Vehicle</li>
							<li>List Your Vehicle</li>
							<li>Become Gold Member</li>
							<li>Refer & Earn</li>
						</ul>
					</div>
				</div>
				<div className="border-t border-white/10">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-white/60 flex items-center justify-between">
						<span>© 2024 WheelsRent. All rights reserved.</span>
						<div className="flex items-center gap-3">
							<span>Privacy</span>
							<span>Terms</span>
							<span>Cookies</span>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default Home;

