import { HistoryItem, cryptocurrencies } from "./store";

/**
 * Calculate portfolio allocation based on history
 * @param history The history items to calculate from
 * @param options Optional parameters for the calculation
 * @returns An array of portfolio items with token and percentage
 */
export function calculatePortfolio(
  history: HistoryItem[],
  options: {
    learningRate?: number;
    timeDecay?: number;
    convergenceThreshold?: number;
    maxIterations?: number;
  } = {}
): Array<{ token: { id: string; name: string; symbol: string; logo?: string }, percentage: number }> {
  if (history.length === 0) return [];

  // Set default options
  const learningRate = options.learningRate ?? 0.9;
  const timeDecay = options.timeDecay ?? 0.95;
  const convergenceThreshold = options.convergenceThreshold ?? 0.0001;
  const maxIterations = options.maxIterations ?? 100;

  // Step 1: Collect all unique tokens from history
  const tokensMap = new Map();

  history.forEach((entry) => {
    if (!tokensMap.has(entry.crypto1.id)) {
      tokensMap.set(entry.crypto1.id, entry.crypto1);
    }
    if (!tokensMap.has(entry.crypto2.id)) {
      tokensMap.set(entry.crypto2.id, entry.crypto2);
    }
  });

  const tokens = Array.from(tokensMap.values());

  // Step 2: Initialize allocations based on frequency
  const tokenAppearances = new Map();
  let totalAppearances = 0;

  history.forEach((entry) => {
    tokenAppearances.set(entry.crypto1.id, (tokenAppearances.get(entry.crypto1.id) || 0) + 1);
    tokenAppearances.set(entry.crypto2.id, (tokenAppearances.get(entry.crypto2.id) || 0) + 1);
    totalAppearances += 2;
  });

  const allocation = new Map();
  tokens.forEach((token) => {
    allocation.set(token.id, (tokenAppearances.get(token.id) || 0) / totalAppearances);
  });

  // Step 3: Iterative refinement
  const alpha = learningRate;
  const decayFactor = timeDecay;

  let iterations = 0;
  let maxChange = 1.0;

  while (maxChange > convergenceThreshold && iterations < maxIterations) {
    const oldAllocation = new Map(allocation);
    maxChange = 0;

    // Process history entries in chronological order
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    sortedHistory.forEach((entry, i) => {
      const timeWeight = Math.pow(decayFactor, sortedHistory.length - 1 - i);

      const tokenA = entry.crypto1.id;
      const tokenB = entry.crypto2.id;
      const prefA = entry.crypto1AllocationPercent / 100;
      const prefB = 1 - prefA;

      // Current normalized allocations for this pair
      const allocA = allocation.get(tokenA) || 0;
      const allocB = allocation.get(tokenB) || 0;
      const sumAB = allocA + allocB;

      if (sumAB > 0) {
        const currANorm = allocA / sumAB;

        // Calculate adjustment based on difference from preference
        const deltaA = (prefA - currANorm) * alpha * timeWeight;

        // Update allocations
        allocation.set(tokenA, allocA + deltaA * sumAB);
        allocation.set(tokenB, allocB - deltaA * sumAB);

        // Ensure non-negative
        allocation.set(tokenA, Math.max(0, allocation.get(tokenA) || 0));
        allocation.set(tokenB, Math.max(0, allocation.get(tokenB) || 0));
      }
    });

    // Normalize to ensure sum = 1
    const total = Array.from(allocation.values()).reduce((sum, val) => sum + val, 0);

    allocation.forEach((value, key) => {
      allocation.set(key, value / total);
    });

    // Check convergence
    allocation.forEach((value, key) => {
      const change = Math.abs(value - (oldAllocation.get(key) || 0));
      maxChange = Math.max(maxChange, change);
    });

    iterations += 1;
  }

  // Step 4: Convert to array and add token info
  const result = Array.from(allocation.entries()).map(([id, percentage]) => {
    const token = tokensMap.get(id);
    return {
      token,
      percentage: percentage * 100,
    };
  });

  // Sort by percentage (descending)
  return result.sort((a, b) => b.percentage - a.percentage);
}
