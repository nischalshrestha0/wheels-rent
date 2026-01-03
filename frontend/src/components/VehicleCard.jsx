import React from 'react';
import { Link } from 'react-router-dom';

const VehicleCard = ({ vehicle }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden border border-gray-200">
      {/* Vehicle Image */}
      <Link to={`/vehicle/${vehicle.id}`} className="block">
        <div className="h-48 bg-gray-200 relative">
          {vehicle.images && vehicle.images.length > 0 ? (
            <img
              src={vehicle.images[0]}
              alt={vehicle.vehicleName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
              </svg>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                vehicle.isAvailable
                  ? 'bg-green-100/90 text-green-700'
                  : 'bg-red-100/90 text-red-700'
              }`}
            >
              {vehicle.isAvailable ? '✓ Available' : '✗ Unavailable'}
            </span>
          </div>
        </div>
      </Link>

      {/* Vehicle Details */}
      <div className="p-4">
        <Link to={`/vehicle/${vehicle.id}`} className="block">
          <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
            {vehicle.vehicleName}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mt-1">
          {vehicle.brand} {vehicle.model} • {vehicle.year}
        </p>

        {/* Owner Info */}
        {vehicle.owner && (
          <Link
            to={`/profile/${vehicle.owner.username}`}
            className="flex items-center gap-2 mt-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {vehicle.owner.fullname.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {vehicle.owner.fullname}
              </p>
              <p className="text-xs text-gray-600">@{vehicle.owner.username}</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        )}

        {/* Features */}
        <div className="flex gap-2 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            {vehicle.seatingCapacity} Seats
          </span>
          <span>•</span>
          <span>{vehicle.transmission}</span>
          <span>•</span>
          <span>{vehicle.fuelType}</span>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Price per day</p>
            <p className="text-lg font-bold text-blue-600">Rs. {vehicle.pricePerDay}</p>
          </div>
          <Link
            to={`/vehicle/${vehicle.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
