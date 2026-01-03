import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VehicleForm from '../components/VehicleForm';
import { useNotification } from '../hooks/useNotification';
import axios from 'axios';

const AddVehicle = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is logged in and is an owner
    const checkAuth = () => {
      console.log(' Checking auth...');
      
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      console.log('Token exists:', !!token);
      console.log('Token value:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');
      console.log('User data:', storedUser);
      
      if (!storedUser) {
        console.log('  No user data in localStorage');
        addNotification('Please login to add vehicles', 'error');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }

      if (!token) {
        console.log('  No token in localStorage');
        addNotification('Session expired. Please login again.', 'error');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      
      const parsedUser = JSON.parse(storedUser);
      console.log('Parsed user:', parsedUser);
      
      if (parsedUser.role !== 'owner') {
        console.log('  User is not an owner:', parsedUser.role);
        addNotification('Only vehicle owners can add vehicles', 'error');
        setTimeout(() => navigate('/'), 1500);
        return;
      }
      
      console.log('  Auth check passed');
      setUser(parsedUser);
      setChecking(false);
    };
    
    checkAuth();
  }, [navigate, addNotification]);

  const validateFormData = (formData) => {
    // Extract fields from FormData for validation
    const get = (key) => formData.get(key) || '';
    const errors = [];

    if (!get('name')) errors.push('Vehicle Name is required');
    if (!get('brand')) errors.push('Brand is required');
    if (!get('model')) errors.push('Model is required');
    if (!get('dailyRate')) errors.push('Daily Rate is required');
    if (!get('location')) errors.push('Location is required');
    if (!get('registrationNumber')) errors.push('Registration Number is required');

    // Registration number format (Nepal: e.g. "Ba 2 Cha 1234" or "GA-01-PA-1234")
    const regNum = get('registrationNumber').trim().toUpperCase();
    const plateRegex = /^[A-Z0-9\- ]{4,}$/;
    if (get('registrationNumber') && !plateRegex.test(regNum)) {
      errors.push('Invalid registration number format (use letters, numbers, - or space)');
    }

    // At least one image (for new vehicle)
    if (!get('images') && !get('existingImages[]')) {
      errors.push('Please upload at least one image');
    }

    return errors;
  };

  const handleSubmit = async (formData) => {
    // --- Client-side validation before sending request ---
    const errors = validateFormData(formData);
    if (errors.length > 0) {
      addNotification(errors.join('\n'), 'error');
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      console.log(' Starting vehicle submission...');
      
      // Get fresh token and user from localStorage
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('Token:', token ? '✓ Present' : '✗ Missing');
      console.log('User data:', storedUser ? '✓ Present' : '✗ Missing');
      
      if (!token) {
        console.log('  No token available');
        addNotification('Session expired. Please login again.', 'error');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const parsedUser = JSON.parse(storedUser || '{}');
      
      if (!parsedUser.id && !parsedUser._id) {
        console.log('  User ID missing');
        addNotification('User information missing. Please login again.', 'error');
        navigate('/login');
        return;
      }

      // Use both id and _id for compatibility
      const userId = parsedUser.id || parsedUser._id;
      console.log('Using user ID:', userId);

      // Ensure owner is in FormData
      if (!formData.has('owner')) {
        formData.append('owner', userId);
        console.log('✓ Added owner to FormData');
      }
      if (!formData.has('ownerId')) {
        formData.append('ownerId', userId);
        console.log('✓ Added ownerId to FormData');
      }

      console.log(' Making API request...');
      console.log('Authorization header:', `Bearer ${token.substring(0, 20)}...`);

      // Make API call with token in Authorization header
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/vehicle`,
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        }
      );

      console.log('  Vehicle added successfully:', response.data);
      addNotification('Vehicle added successfully!', 'success');
      setTimeout(() => navigate('/my-vehicles'), 1500);
      
    } catch (error) {
      console.error('  Error adding vehicle:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMsg = 'Failed to add vehicle. ';

      // --- Improved error handling for backend validation ---
      if (error.response?.status === 409) {
        // Plate number already exists
        if (error.response?.data?.message?.toLowerCase().includes('plate number')) {
          errorMsg = 'A vehicle with this registration number already exists. Please check and enter a unique registration number.';
        } else {
          errorMsg = error.response?.data?.message || 'Duplicate entry detected.';
        }
      } else if (error.response?.status === 400) {
        // Backend validation error with details
        if (error.response?.data?.details) {
          const details = error.response.data.details;
          if (typeof details === 'object') {
            errorMsg = 'Missing or invalid fields:\n' +
              Object.entries(details)
                .filter(([k, v]) => v !== 'ok')
                .map(([k, v]) => `- ${k}: ${v}`)
                .join('\n');
          } else {
            errorMsg = error.response.data.message || 'Please check all required fields.';
          }
        } else if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.response?.status === 422) {
        errorMsg = error.response?.data?.message || 'Invalid registration number format.';
      } else if (error.response?.status === 401) {
        console.log(' Unauthorized - clearing auth');
        errorMsg = 'Session expired. Please login again.';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 1500);
      } else if (error.response?.status === 403) {
        errorMsg = 'You do not have permission to add vehicles.';
      } else {
        errorMsg += error.message || 'Please try again.';
      }

      addNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600 font-medium">Checking authentication...</p>
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
        <div className="max-w-4xl mx-auto px-4">
          <VehicleForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AddVehicle;
