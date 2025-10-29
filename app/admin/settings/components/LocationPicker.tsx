'use client';
import { useState, useCallback, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import {toast} from "sonner";

const containerStyle = {
  width: '100%',
  height: '250px'
};

const mobileContainerStyle = {
  width: '100%',
  height: '200px'
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center

// Restrict search to India
const autocompleteOptions = {
  componentRestrictions: { country: "in" }
};

interface LocationPickerProps {
  location?: { lat: number; lng: number };
  onLocationChange: (location: { lat: number; lng: number } | undefined) => void;
}

export default function LocationPicker({ location, onLocationChange }: LocationPickerProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: ['places']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState(location || defaultCenter);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Update marker position when location prop changes
  useEffect(() => {
    if (location) {
      setMarkerPosition(location);
    }
  }, [location]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
    if (autocompleteInstance && autocompleteInstance.setOptions) {
      autocompleteInstance.setOptions(autocompleteOptions);
    }
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const location = place.geometry.location;
        const newPos = { lat: location.lat(), lng: location.lng() };
        setMarkerPosition(newPos);
        if (map) {
          map.panTo(newPos);
        }
        onLocationChange(newPos);
      }
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPosition(newPos);
      onLocationChange(newPos);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setMarkerPosition(newPos);
          if (map) {
            map.panTo(newPos);
          }
          onLocationChange(newPos);
          setIsGettingLocation(false);
          toast.success('Location set successfully');
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Unable to get your current location. Please try again or select manually.');
          setIsGettingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const clearLocation = () => {
    onLocationChange(undefined);
    setMarkerPosition(defaultCenter);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[200px] sm:h-[250px] lg:h-[300px] bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-black dark:border-white mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Set Your Restaurant Location
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Search for your restaurant address or use your current location. Click anywhere on the map to set the exact position.
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="space-y-3">
        <div className="relative">
          <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
            <input
              type="text"
              placeholder="Search for your restaurant location..."
              className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200 pr-12"
            />
          </Autocomplete>
          {location && (
            <button
              onClick={clearLocation}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all duration-200"
              title="Clear location"
            >
              <span className="text-sm">✕</span>
            </button>
          )}
        </div>

        {/* OR Divider */}
        <div className="flex items-center justify-center">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          <span className="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide bg-gray-50 dark:bg-gray-800 rounded-full">
            OR
          </span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
        </div>

        {/* Current Location Button */}
        <div className="flex justify-center">
          <button
            onClick={handleCurrentLocation}
            disabled={isGettingLocation}
            className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg w-full sm:w-auto"
          >
            {isGettingLocation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Getting Location...</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                <span>Use Current Location</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={markerPosition}
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
            options={{
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            }}
          >
            <Marker position={markerPosition} />
          </GoogleMap>
        </div>
      </div>

      {location && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                Location Set Successfully!
              </p>
              <p className="text-xs text-green-600 dark:text-green-300 break-all">
                <span className="font-semibold">Lat:</span> {location.lat.toFixed(6)}, <span className="font-semibold">Lng:</span> {location.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
