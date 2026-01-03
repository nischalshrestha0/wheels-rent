import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNotification } from '../hooks/useNotification';
import api from '../utils/api';

const MyVehicles = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMyVehicles();
  }, []);

  // Build image URL: supports absolute URLs, /uploads paths, and proxied backend (/api)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/600x400?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;

    // imagePath may be like "uploads/..." or "/uploads/..."
    const clean = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    // Use proxy in dev (api.js already points to /api in dev), so prefix with base '/api' when needed
    // If imagePath already contains '/uploads', prefix with '/api' to proxy to backend
    if (clean.startsWith('/uploads')) {
      return `/api${clean}`; // will be proxied to backend/uploads/...
    }
    // Otherwise assume it's a backend-relative path
    return `/api${clean}`;
  };

  const fetchMyVehicles = async () => {
    try {
      setLoading(true);

      // current user id (stored after login/registration)
      const stored = localStorage.getItem('user');
      const currentUserId = stored ? (JSON.parse(stored)._id || JSON.parse(stored).id) : null;

      // Fetch canonical vehicles endpoint and filter locally for owner
      const res = await api.get('/vehicle');

      const allVehicles = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data.vehicles) ? res.data.vehicles : []);

      const ownerVehicles = currentUserId
        ? allVehicles.filter(v => {
            const ownerId = v.owner?._id || v.owner?.id || v.owner;
            return String(ownerId) === String(currentUserId);
          })
        : allVehicles;

      // Normalize images array: ensure vehicles have image(s) array
      const normalized = ownerVehicles.map(v => ({
        ...v,
        images: Array.isArray(v.image) && v.image.length ? v.image : (Array.isArray(v.images) ? v.images : []),
      }));

      setVehicles(normalized);
    } catch (error) {
      console.error('Error fetching vehicles for owner view:', error);
      addNotification('Could not load your vehicles. Showing demo data.', 'warning');
      setVehicles([
        {
          _id: 'demo-1',
          name: 'Demo Vehicle - Honda Civic 2021',
          brand: 'Honda',
          model: 'Civic',
          year: 2021,
          type: 'car',
          dailyRate: 2500,
          location: 'Kathmandu',
          available: true,
          images: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      if (id.startsWith('demo-')) {
        addNotification('Cannot delete demo vehicles. Connect backend to manage real vehicles.', 'warning');
        return;
      }

      try {
        await api.delete(`/vehicle/${id}`);
        setVehicles((prev) => prev.filter((v) => v._id !== id));
        addNotification('Vehicle deleted successfully', 'success');
      } catch (error) {
        console.error('Delete error:', error);
        if (error.response?.status === 401) {
          // token missing/expired — force login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          addNotification('Session expired. Please login again.', 'error');
          navigate('/login');
          return;
        }
        addNotification(error.response?.data?.message || 'Failed to delete vehicle', 'error');
      }
    }
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    if (id.startsWith('demo-')) {
      addNotification('Cannot modify demo vehicles. Connect backend to manage real vehicles.', 'warning');
      return;
    }

    try {
      // Toggle status: available <-> unavailable
      await api.put(`/vehicle/${id}`, { available: !currentStatus });
      setVehicles((prev) =>
        prev.map((v) =>
          v._id === id ? { ...v, available: !currentStatus, status: !currentStatus ? 'available' : 'unavailable' } : v
        )
      );
      addNotification(`Vehicle ${!currentStatus ? 'listed' : 'unlisted'} successfully`, 'success');
    } catch (error) {
      console.error('Toggle error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        addNotification('Session expired. Please login again.', 'error');
        navigate('/login');
        return;
      }
      addNotification(error.response?.data?.message || 'Failed to update vehicle status', 'error');
    }
  };

  // When rendering vehicle image, normalize available fields:
  const getDisplayImage = (v) => {
    const img = Array.isArray(v.images) && v.images.length
      ? v.images[0]
      : Array.isArray(v.image) && v.image.length
        ? v.image[0]
        : (v.images?.[0] || v.image?.[0] || v.images?.[0]);

    if (!img) return 'https://placehold.co/600x400?text=No+Image';
    if (img.startsWith('http')) return img;
    // use proxy path for uploads
    return img.startsWith('/uploads') ? `/api${img}` : `/api/${img.replace(/^\/+/, '')}`;
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filter === 'available') return v.status === 'available' || v.available;
    if (filter === 'unavailable') return v.status === 'unavailable' || !v.available;
    return true;
  });

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600 font-medium">Loading your vehicles...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Vehicles</h1>
              <p className="text-gray-600 mt-1">Manage your vehicle listings</p>
            </div>
            <button
              onClick={() => navigate('/add-vehicle')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Add Vehicle
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6 border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'all', label: 'All Vehicles', count: vehicles.length },
                {
                  id: 'available',
                  label: 'Available',
                  count: vehicles.filter((v) => v.status === 'available' || v.available).length,
                },
                {
                  id: 'unavailable',
                  label: 'Unavailable',
                  count: vehicles.filter((v) => v.status === 'unavailable' || !v.available).length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
                    filter === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                      filter === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicles Grid */}
          {filteredVehicles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">No vehicles found</p>
              <p className="text-gray-400 mt-1">
                {filter === 'all'
                  ? "You haven't added any vehicles yet"
                  : `No ${filter} vehicles at the moment`}
              </p>
              <button
                onClick={() => navigate('/add-vehicle')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Add Your First Vehicle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle._id || vehicle.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden border border-gray-200"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <img
                        src={getDisplayImage(vehicle)}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                        </svg>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          (vehicle.status === 'available' || vehicle.available)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {(vehicle.status === 'available' || vehicle.available) ? '✓ Available' : '✗ Unavailable'}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {vehicle.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {vehicle.brand} {vehicle.model} • {vehicle.year}
                    </p>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Daily Rate</p>
                        <p className="font-semibold text-gray-900">
                          Rs. {vehicle.dailyRate}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Location</p>
                        <p className="font-semibold text-gray-900 truncate">
                          {vehicle.location}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() =>
                          navigate(`/edit-vehicle/${vehicle._id || vehicle.id}`)
                        }
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold text-sm transition-colors"
                      >
                         Edit
                      </button>
                      <button
                        onClick={() =>
                          handleToggleAvailability(
                            vehicle._id || vehicle.id,
                            vehicle.status === 'available' || vehicle.available
                          )
                        }
                        className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          (vehicle.status === 'available' || vehicle.available)
                            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {(vehicle.status === 'available' || vehicle.available) ? ' Unlist' : ' List'}
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle._id || vehicle.id)}
                        className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold text-sm transition-colors"
                      >
                         Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyVehicles;
