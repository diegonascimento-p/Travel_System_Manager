export interface DistanceCalculator {
  /**
   * Driving distance in meters from the origin address to each destination address. A destination
   * missing from the result could not be routed (unknown address or no road route).
   */
  metersFrom(origin: string, destinations: string[]): Promise<Map<string, number>>;
  /**
   * Driving distance in meters from each origin address to the destination address. An origin
   * missing from the result could not be routed (unknown address or no road route).
   */
  metersTo(origins: string[], destination: string): Promise<Map<string, number>>;
}
