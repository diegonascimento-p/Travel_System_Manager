export interface DistanceCalculator {
  /**
   * Driving distance in miles from the origin address to each destination address. A destination
   * missing from the result could not be routed (unknown address or no road route).
   */
  milesFrom(origin: string, destinations: string[]): Promise<Map<string, number>>;
}
