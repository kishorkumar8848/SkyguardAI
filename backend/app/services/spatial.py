import math
import numpy as np
from typing import Dict, List, Optional
from backend.app.models.schemas import ObservationRaw, SpatialResult

class SpatialConsistencyEngine:
    """
    Evaluates spatial consistency among neighboring Automatic Weather Stations (AWS).
    Distinguishes localized sensor faults from regional meteorological events.
    """

    def __init__(self, max_distance_km: float = 350.0):
        self.max_distance_km = max_distance_km

    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Computes great-circle distance between two geographic coordinates in kilometers."""
        r = 6371.0  # Earth radius in km
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0)**2
        return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    def evaluate_spatial_consistency(
        self,
        target_obs: ObservationRaw,
        peer_observations: Dict[str, ObservationRaw]
    ) -> Optional[SpatialResult]:
        if target_obs.temperature is None or target_obs.latitude is None or target_obs.longitude is None:
            return None

        # Filter neighbors by distance
        neighbors: List[ObservationRaw] = []
        for sid, obs in peer_observations.items():
            if sid == target_obs.station_id or obs.temperature is None:
                continue
            if obs.latitude is not None and obs.longitude is not None:
                dist = self.haversine_distance(
                    target_obs.latitude, target_obs.longitude,
                    obs.latitude, obs.longitude
                )
                if dist <= self.max_distance_km:
                    neighbors.append(obs)

        if not neighbors:
            # If no nearby stations exist within distance threshold, return None (spatial mode is optional)
            return None

        neighbor_temps = [n.temperature for n in neighbors if n.temperature is not None]
        spatial_median_temp = float(np.median(neighbor_temps))
        spatial_diff = target_obs.temperature - spatial_median_temp

        # Variance of neighborhood
        std_spatial = float(np.std(neighbor_temps)) if len(neighbor_temps) > 1 else 1.5
        norm_diff = abs(spatial_diff) / max(std_spatial, 0.8)

        # Outlier check: station deviates by > 2.5 spatial sigma
        is_spatial_outlier = bool(norm_diff > 2.5)

        # Regional consensus: proportion of neighbors that are mutually consistent
        neighborhood_consensus = float(max(0.0, min(1.0, 1.0 - (std_spatial / 5.0))))

        # Regional event support: if station has high temp, but neighbors ALSO show elevated temp
        regional_event_support = bool((not is_spatial_outlier) and (abs(spatial_diff) < 2.5))

        return SpatialResult(
            neighbor_count=len(neighbors),
            spatial_median_temp=round(spatial_median_temp, 2),
            temp_spatial_diff=round(spatial_diff, 2),
            neighborhood_consensus=round(neighborhood_consensus, 2),
            is_spatial_outlier=is_spatial_outlier,
            regional_event_support=regional_event_support
        )
