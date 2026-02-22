import axios from "axios";
import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Booking from "../models/Booking";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

export async function updateProviderLocation(req: AuthRequest, res: Response) {
  try {
    const { bookingId } = req.params;
    const { latitude, longitude, heading, speed } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Only provider can update their location
    if (booking.providerId !== req.user?.uid) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Update provider's location
    booking.providerLocation = {
      latitude,
      longitude,
      lastUpdated: new Date(),
      heading: heading || 0,
      speed: speed || 0,
    };

    // Calculate distance and ETA if status is "on-the-way"
    if (booking.status === "on-the-way") {
      try {
        const distanceData = await calculateDistanceAndETA(
          latitude,
          longitude,
          booking.serviceLocation.latitude,
          booking.serviceLocation.longitude,
        );

        if (!booking.tracking) {
          booking.tracking = {};
        }

        booking.tracking.estimatedDistance = distanceData.distance;
        booking.tracking.estimatedDuration = distanceData.duration;
        booking.tracking.lastCalculated = new Date();
      } catch (error) {
        console.error("Error calculating distance/ETA:", error);
      }
    }

    await booking.save();

    res.json({
      success: true,
      message: "Location updated successfully",
      data: {
        providerLocation: booking.providerLocation,
        tracking: booking.tracking,
      },
    });
  } catch (error: any) {
    console.error("Error updating provider location:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function getProviderLocation(req: AuthRequest, res: Response) {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Check authorization
    if (
      booking.customerId !== req.user?.uid &&
      booking.providerId !== req.user?.uid
    ) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Only provide tracking data if status is appropriate
    if (
      booking.status !== "on-the-way" &&
      booking.status !== "arrived" &&
      booking.status !== "in-progress"
    ) {
      return res.json({
        success: true,
        data: {
          trackingAvailable: false,
          status: booking.status,
        },
      });
    }

    res.json({
      success: true,
      data: {
        trackingAvailable: true,
        status: booking.status,
        providerLocation: booking.providerLocation,
        serviceLocation: booking.serviceLocation,
        tracking: booking.tracking,
        providerDetails: {
          name: booking.providerDetails.name,
          phone: booking.providerDetails.phone,
          profilePhoto: booking.providerDetails.profilePhoto,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching tracking data:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function geocodeAddressController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Address is required",
      });
    }

    const geocodeResult = await geocodeAddress(address);

    if (!geocodeResult) {
      return res.status(404).json({
        success: false,
        error: "Address not found",
      });
    }

    res.json({
      success: true,
      data: geocodeResult,
    });
  } catch (error: any) {
    console.error("Error geocoding address:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function reverseGeocodeController(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "Latitude and longitude are required",
      });
    }

    const reverseGeocodeResult = await reverseGeocode(latitude, longitude);

    if (!reverseGeocodeResult) {
      return res.status(404).json({
        success: false,
        error: "Address not found for coordinates",
      });
    }

    res.json({
      success: true,
      data: reverseGeocodeResult,
    });
  } catch (error: any) {
    console.error("Error reverse geocoding:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Helper Functions

/**
 * Calculate distance and ETA using Google Maps Distance Matrix API
 */
async function calculateDistanceAndETA(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<{ distance: number; duration: number }> {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins: `${originLat},${originLng}`,
          destinations: `${destLat},${destLng}`,
          mode: "driving",
          key: GOOGLE_MAPS_API_KEY,
        },
      },
    );

    if (
      response.data.status === "OK" &&
      response.data.rows[0].elements[0].status === "OK"
    ) {
      const element = response.data.rows[0].elements[0];
      return {
        distance: element.distance.value, // meters
        duration: element.duration.value, // seconds
      };
    }

    throw new Error("Unable to calculate distance");
  } catch (error) {
    console.error("Distance Matrix API error:", error);
    throw error;
  }
}

/**
 * Geocode an address to coordinates
 */
async function geocodeAddress(address: string): Promise<{
  latitude: number;
  longitude: number;
  formattedAddress: string;
} | null> {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address,
          key: GOOGLE_MAPS_API_KEY,
        },
      },
    );

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding API error:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address
 */
async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<{ formattedAddress: string } | null> {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_MAPS_API_KEY,
        },
      },
    );

    if (response.data.status === "OK" && response.data.results.length > 0) {
      return {
        formattedAddress: response.data.results[0].formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding API error:", error);
    return null;
  }
}
