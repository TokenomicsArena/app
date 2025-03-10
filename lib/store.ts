import { create } from "zustand"
import { persist } from "zustand/middleware"

// Define the cryptocurrency type
export type Cryptocurrency = {
  id: string
  name: string
  symbol: string
  logo: string
  price: number
  marketCap?: number
}

// Import cryptocurrency data from JSON file
import cryptoData from '../public/coinmarketcap-data.json';

// Default cryptocurrency data
export const defaultCryptocurrencies: Cryptocurrency[] = cryptoData as Cryptocurrency[];

// This will be populated from the store
export let cryptocurrencies: Cryptocurrency[] = [...defaultCryptocurrencies]

// Type for history items
export type HistoryItem = {
  id: string
  timestamp: Date
  crypto1: Cryptocurrency
  crypto2: Cryptocurrency
  crypto1AllocationPercent: number
  explanation: string
}

// Type for temporarily denylisted tokens (those that received 0% allocation)
type TempDeniedToken = {
  id: string
  iterationsLeft: number
}

// Get a normalized pair key (order-independent)
export const getNormalizedPairKey = (id1: string, id2: string): string => {
  return [id1, id2].sort().join('-')
}

// Calculate the total number of possible pairs
export const getTotalPossiblePairs = (): number => {
  const n = cryptocurrencies.length
  return (n * (n - 1)) / 2
}

// Check if a specific pair has been selected before
export const isPairSelected = async (id1: string, id2: string): Promise<boolean> => {
  // Ensure store is initialized before proceeding
  await ensureStoreInitialized();

  const store = useStore.getState()
  const history = store.history

  const normalizedKey = getNormalizedPairKey(id1, id2)

  return history.some(item =>
    getNormalizedPairKey(item.crypto1.id, item.crypto2.id) === normalizedKey
  )
}

// Check if all possible pairs have been selected
export const allPairsSelected = async (): Promise<boolean> => {
  // Ensure store is initialized before proceeding
  await ensureStoreInitialized();

  const store = useStore.getState()
  const history = store.history

  // Create a set of unique pairs (regardless of order)
  const uniquePairs = new Set<string>()

  history.forEach(item => {
    uniquePairs.add(getNormalizedPairKey(item.crypto1.id, item.crypto2.id))
  })

  return uniquePairs.size >= getTotalPossiblePairs()
}

/**
 * Get two random cryptocurrencies that haven't been compared before
 */
export const getRandomPair = async (): Promise<[Cryptocurrency, Cryptocurrency] | null> => {
  // Ensure store is initialized before proceeding
  await ensureStoreInitialized();

  const store = useStore.getState();
  const deniedTokens = store.deniedTokens;
  const tempDeniedTokens = store.tempDeniedTokens;

  // Filter out denied tokens and temporarily denied tokens
  const tempDeniedIds = tempDeniedTokens.map(item => item.id);
  const availableTokens = cryptocurrencies.filter(token =>
    !deniedTokens.includes(token.id) && !tempDeniedIds.includes(token.id)
  );

  // Check if we have enough tokens
  if (availableTokens.length < 2) {
    console.warn("Not enough tokens available after filtering denylist. Resetting denylist.");
    store.resetDenylist();
    return getRandomPair(); // Try again with reset blacklist
  }

  // Find all valid pairs that haven't been compared yet
  const validPairs: [Cryptocurrency, Cryptocurrency][] = [];

  for (let i = 0; i < availableTokens.length; i++) {
    for (let j = i + 1; j < availableTokens.length; j++) {
      const token1 = availableTokens[i];
      const token2 = availableTokens[j];

      // Check if this pair has been seen before (in either order)
      const isPaired = await isPairSelected(token1.id, token2.id);
      if (!isPaired) {
        validPairs.push([token1, token2]);
      }
    }
  }

  // If we found valid pairs, choose one randomly
  if (validPairs.length > 0) {
    return validPairs[Math.floor(Math.random() * validPairs.length)];
  }

  // If all pairs have been compared, use selectLeastRecentlyComparedPair
  console.warn("All possible token pairs have been compared. Selecting least recently compared pair.");
  return selectLeastRecentlyComparedPair(availableTokens);
}

/**
 * Select the pair of tokens that was compared least recently
 */
const selectLeastRecentlyComparedPair = async (tokens: Cryptocurrency[]): Promise<[Cryptocurrency, Cryptocurrency] | null> => {
  // Ensure store is initialized before proceeding
  await ensureStoreInitialized();

  const store = useStore.getState();
  const history = store.history;

  // If no history, just return two random tokens
  if (history.length === 0) {
    const shuffled = [...tokens].sort(() => 0.5 - Math.random());
    return [shuffled[0], shuffled[1]];
  }

  // For each pair, find when it was last compared
  const pairsWithTimestamp: { pair: [Cryptocurrency, Cryptocurrency], timestamp: number }[] = [];

  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const token1 = tokens[i];
      const token2 = tokens[j];
      const normalizedKey = getNormalizedPairKey(token1.id, token2.id);

      // Find the most recent comparison of this pair
      let latestComparison = -1;
      for (const item of history) {
        const itemKey = getNormalizedPairKey(item.crypto1.id, item.crypto2.id);
        if (itemKey === normalizedKey) {
          const timestamp = new Date(item.timestamp).getTime();
          if (timestamp > latestComparison) {
            latestComparison = timestamp;
          }
        }
      }

      // If this pair was never compared, use -1 (which means oldest)
      pairsWithTimestamp.push({
        pair: [token1, token2],
        timestamp: latestComparison
      });
    }
  }

  // Sort by timestamp (oldest first)
  pairsWithTimestamp.sort((a, b) => a.timestamp - b.timestamp);

  // Return the oldest compared pair, or the first pair if none were compared
  return pairsWithTimestamp[0]?.pair || [tokens[0], tokens[1]];
}

// Get a set of all compared pairs from history
const getComparedPairs = (history: HistoryItem[]): Set<string> => {
  const pairs = new Set<string>();
  history.forEach(item => {
    pairs.add(getNormalizedPairKey(item.crypto1.id, item.crypto2.id));
  });
  return pairs;
};

// Get tokens that have been seen in history
const getSeenTokens = (history: HistoryItem[], availableTokens: Cryptocurrency[]) => {
  const seenIds = new Set<string>();
  history.forEach(item => {
    seenIds.add(item.crypto1.id);
    seenIds.add(item.crypto2.id);
  });

  return {
    seen: availableTokens.filter(token => seenIds.has(token.id)),
    unseen: availableTokens.filter(token => !seenIds.has(token.id))
  };
};

// Get preferred tokens from recent history (last 10 entries)
const getPreferredTokens = (history: HistoryItem[], availableTokens: Cryptocurrency[]): Cryptocurrency[] => {
  if (history.length === 0) return [];

  const recentHistory = history.slice(0, Math.min(10, history.length));
  const preferredIds = new Set<string>();

  recentHistory.forEach(item => {
    // Consider a token "preferred" if it received more than 90% allocation
    if (item.crypto1AllocationPercent > 90) {
      preferredIds.add(item.crypto1.id);
    } else if (item.crypto1AllocationPercent < 40) {
      preferredIds.add(item.crypto2.id);
    }
  });

  return availableTokens.filter(token => preferredIds.has(token.id));
};

// Calculate top 10 tokens based on portfolio allocation algorithm
const getTopTenTokens = (history: HistoryItem[], availableTokens: Cryptocurrency[]): Cryptocurrency[] => {
  if (history.length === 0) return [];

  try {
    // Step 1: Collect all unique tokens from history
    const tokensMap = new Map<string, Cryptocurrency>();

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
    const tokenAppearances = new Map<string, number>();
    let totalAppearances = 0;

    history.forEach((entry) => {
      tokenAppearances.set(entry.crypto1.id, (tokenAppearances.get(entry.crypto1.id) || 0) + 1);
      tokenAppearances.set(entry.crypto2.id, (tokenAppearances.get(entry.crypto2.id) || 0) + 1);
      totalAppearances += 2;
    });

    const allocation = new Map<string, number>();
    tokens.forEach((token) => {
      allocation.set(token.id, (tokenAppearances.get(token.id) || 0) / totalAppearances);
    });

    // Step 3: Iterative refinement
    const alpha = 0.9; // Learning rate
    const decayFactor = 0.95; // Time decay
    const convergenceThreshold = 0.0001;
    const maxIterations = 100;

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
    const result = Array.from(allocation.entries())
      .map(([id, percentage]) => ({
        token: tokensMap.get(id)!,
        percentage: percentage * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage) // Sort by percentage (descending)
      .filter(item => item.percentage > 0) // Only include tokens with non-zero allocation
      .slice(0, 10) // Get top 10
      .map(item => item.token); // Extract just the token objects

    // Filter to only include available tokens
    return result.filter(token =>
      availableTokens.some(availableToken => availableToken.id === token.id)
    );
  } catch (error) {
    console.error("Error calculating top tokens:", error);
    return [];
  }
};

// Find a valid second token that hasn't been paired with the first token
const findValidSecondToken = (firstToken: Cryptocurrency, availableTokens: Cryptocurrency[], comparedPairs: Set<string>): Cryptocurrency[] => {
  return availableTokens.filter(token =>
    token.id !== firstToken.id &&
    !comparedPairs.has(getNormalizedPairKey(firstToken.id, token.id))
  );
};

// Prioritized tokens for new users (less than 30 history entries)
const PRIORITIZED_TOKENS = [
  "aave",
  "algorand",
  "aptos",
  "arbitrum",
  "avalanche",
  "bitcoin",
  "bitget-token-new",
  "bnb",
  "cardano",
  "celestia",
  "chainlink",
  "cosmos",
  "decentraland",
  "dogecoin",
  "ethereum",
  "ethereum-name-service",
  "filecoin",
  "flow",
  "hedera",
  "internet-computer",
  "lido-dao",
  "litecoin",
  "mantle",
  "monero",
  "near-protocol",
  "okb",
  "optimism-ethereum",
  "pepe",
  "polkadot-new",
  "polygon-ecosystem-token",
  "render",
  "shiba-inu",
  "solana",
  "stellar",
  "sui",
  "the-graph",
  "toncoin",
  "tron",
  "uniswap",
  "xrp",
  "zcash",
];

// Find the least recently compared token pair
const findLeastRecentPair = (firstToken: Cryptocurrency, possiblePartners: Cryptocurrency[], history: HistoryItem[]): Cryptocurrency | null => {
  if (possiblePartners.length === 0) return null;

  // Initialize with the first possible partner
  let leastRecentPartner = possiblePartners[0];
  let oldestTimestamp = new Date();

  // For each possible partner, find when it was last compared with the first token
  for (const partner of possiblePartners) {
    const pairKey = getNormalizedPairKey(firstToken.id, partner.id);

    // Find the most recent comparison of this pair
    let mostRecentComparison = null;

    for (const item of history) {
      const itemPairKey = getNormalizedPairKey(item.crypto1.id, item.crypto2.id);

      if (itemPairKey === pairKey) {
        const itemDate = new Date(item.timestamp);
        if (!mostRecentComparison || itemDate > new Date(mostRecentComparison.timestamp)) {
          mostRecentComparison = item;
        }
      }
    }

    // If this pair was compared less recently than the current oldest, update
    const comparisonDate = mostRecentComparison ? new Date(mostRecentComparison.timestamp) : new Date(0);
    if (comparisonDate < oldestTimestamp) {
      oldestTimestamp = comparisonDate;
      leastRecentPartner = partner;
    }
  }

  return leastRecentPartner;
};

// Select a first token based on user experience and token availability
const selectFirstToken = (availableTokens: Cryptocurrency[], history: HistoryItem[], unseenTokens: Cryptocurrency[], preferredTokens: Cryptocurrency[]): Cryptocurrency => {
  const isNewUser = history.length < 30;

  // For new users, prioritize the specified tokens
  if (isNewUser) {
    const prioritizedAvailable = availableTokens.filter(token =>
      PRIORITIZED_TOKENS.includes(token.id)
    );

    if (prioritizedAvailable.length > 0) {
      return prioritizedAvailable[Math.floor(Math.random() * prioritizedAvailable.length)];
    }
  }

  // Selection strategy with weights:
  const randomValue = Math.random();

  // 50% chance to use an unseen token if available
  if (unseenTokens.length > 0 && randomValue < 0.5) {
    return unseenTokens[Math.floor(Math.random() * unseenTokens.length)];
  }
  // 30% chance to use a preferred token if available
  else if (preferredTokens.length > 0 && randomValue < 0.8) {
    return preferredTokens[Math.floor(Math.random() * preferredTokens.length)];
  }
  // 20% chance for pure randomness
  else {
    return availableTokens[Math.floor(Math.random() * availableTokens.length)];
  }
};

/**
 * Smart pair selection that balances exploration and preference refinement
 * This is a wrapper for getTokenPair to maintain backward compatibility
 */
export const getSmartPair = async (): Promise<[Cryptocurrency, Cryptocurrency] | null> => {
  // Ensure store is initialized before proceeding
  await ensureStoreInitialized();

  // Decrement counters for temporarily denied tokens
  useStore.getState().decrementTempDenylistCounters();

  // Call the new implementation
  return getTokenPair();
};

// Main function to get a pair of tokens to compare
const getTokenPair = (): [Cryptocurrency, Cryptocurrency] | null => {
  const store = useStore.getState();
  const { history, deniedTokens, tempDeniedTokens, tokens } = store;

  // Filter out denied tokens and temporarily denied tokens
  const tempDeniedIds = tempDeniedTokens.map(item => item.id);
  const availableTokens = tokens.filter(token =>
    !deniedTokens.includes(token.id) && !tempDeniedIds.includes(token.id)
  );

  // Check if we have enough tokens (at least 2)
  if (availableTokens.length < 2) {
    console.warn("Not enough tokens available. Need at least 2 tokens for comparison.");
    return null;
  }

  // Get tokens that have been seen and those that haven't
  const { seen: seenTokens, unseen: unseenTokens } = getSeenTokens(history, availableTokens);

  // Get preferred tokens from recent history
  const preferredTokens = getPreferredTokens(history, availableTokens);

  // Get all compared pairs to avoid repeats
  const comparedPairs = getComparedPairs(history);

  // After 30 selections, prioritize comparing top 10 tokens against each other
  if (history.length >= 30 && history.length < 60) {
    // Get top 10 tokens based on portfolio allocation
    const topTenTokens = getTopTenTokens(history, availableTokens);

    if (topTenTokens.length >= 2) {
      // Count how many times each top 10 token has been compared
      const tokenComparisonCounts = new Map<string, number>();

      // Initialize counts to 0
      topTenTokens.forEach(token => {
        tokenComparisonCounts.set(token.id, 0);
      });

      // Count comparisons for each token
      history.forEach(item => {
        if (tokenComparisonCounts.has(item.crypto1.id)) {
          tokenComparisonCounts.set(
            item.crypto1.id,
            (tokenComparisonCounts.get(item.crypto1.id) || 0) + 1
          );
        }
        if (tokenComparisonCounts.has(item.crypto2.id)) {
          tokenComparisonCounts.set(
            item.crypto2.id,
            (tokenComparisonCounts.get(item.crypto2.id) || 0) + 1
          );
        }
      });

      // Sort top 10 tokens by comparison count (ascending)
      const sortedTopTokens = [...topTenTokens].sort((a, b) =>
        (tokenComparisonCounts.get(a.id) || 0) - (tokenComparisonCounts.get(b.id) || 0)
      );

      // Try to find pairs of top 10 tokens that haven't been compared yet
      const topTenPairs: [Cryptocurrency, Cryptocurrency][] = [];

      // Prioritize tokens with fewer comparisons
      for (let i = 0; i < sortedTopTokens.length; i++) {
        const token1 = sortedTopTokens[i];

        for (let j = 0; j < sortedTopTokens.length; j++) {
          if (i === j) continue;

          const token2 = sortedTopTokens[j];

          // Check if this pair has been compared before
          if (!comparedPairs.has(getNormalizedPairKey(token1.id, token2.id))) {
            // Add to pairs, with priority to least compared tokens
            topTenPairs.push([token1, token2]);

            // If we found a pair with the least compared token, return it immediately
            if (i === 0) {
              console.log(`Prioritizing comparison with least compared token: ${token1.name}`);
              return [token1, token2];
            }
          }
        }
      }

      // If we found valid pairs among top 10, choose one
      if (topTenPairs.length > 0) {
        return topTenPairs[0]; // Return the first pair (with least compared tokens)
      }

      // If all top 10 pairs have been compared, find the least recently compared pair among top 10
      if (topTenPairs.length === 0 && Math.random() < 0.7) { // 70% chance to still prioritize top 10
        // Pick the least compared token from top 10
        const firstToken = sortedTopTokens[0];
        // Find the least recently compared partner from the other top 10 tokens
        const otherTopTokens = topTenTokens.filter(token => token.id !== firstToken.id);
        const leastRecentPartner = findLeastRecentPair(firstToken, otherTopTokens, history);

        if (leastRecentPartner) {
          console.log(`Using least compared token (${firstToken.name}) with least recently compared partner.`);
          return [firstToken, leastRecentPartner];
        }
      }
    }
  }

  // Try up to 3 times to find a valid pair (with different first tokens)
  for (let attempt = 0; attempt < 3; attempt++) {
    // Select first token
    const firstToken = selectFirstToken(availableTokens, history, unseenTokens, preferredTokens);

    // Find valid candidates for the second token
    const validCandidates = findValidSecondToken(firstToken, availableTokens, comparedPairs);

    // If we have valid candidates, select one
    if (validCandidates.length > 0) {
      // Selection strategy for second token
      let secondToken = null;

      // 50-50 chance between unseen and seen tokens
      if (Math.random() < 0.5) {
        // Try to select an unseen token
        const unseenCandidates = validCandidates.filter(token =>
          unseenTokens.some(t => t.id === token.id)
        );

        if (unseenCandidates.length > 0) {
          secondToken = unseenCandidates[Math.floor(Math.random() * unseenCandidates.length)];
        }
      }

      // If we didn't select an unseen token, try a seen one
      if (!secondToken) {
        const seenCandidates = validCandidates.filter(token =>
          seenTokens.some(t => t.id === token.id)
        );

        if (seenCandidates.length > 0) {
          secondToken = seenCandidates[Math.floor(Math.random() * seenCandidates.length)];
        }
      }

      // If we still don't have a second token, just pick randomly from valid candidates
      if (!secondToken) {
        secondToken = validCandidates[Math.floor(Math.random() * validCandidates.length)];
      }

      return [firstToken, secondToken];
    }

    // If we have no valid candidates, find the least recently compared pair
    if (attempt === 2) {
      const otherTokens = availableTokens.filter(token => token.id !== firstToken.id);
      const leastRecentPartner = findLeastRecentPair(firstToken, otherTokens, history);

      if (leastRecentPartner) {
        console.log("All possible pairs have been compared. Using least recently compared pair.");
        return [firstToken, leastRecentPartner];
      }
    }
    // Otherwise try again with a different first token
  }

  // If we exhausted all attempts, fall back to random selection of two different tokens
  console.warn("Could not find valid pair after multiple attempts. Using random selection.");
  const shuffled = [...availableTokens].sort(() => 0.5 - Math.random());
  return [shuffled[0], shuffled[1]];
};

type Store = {
  // History management
  history: HistoryItem[]
  addToHistory: (item: HistoryItem) => void
  updateHistory: (id: string, item: HistoryItem) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  exportHistory: () => { history: HistoryItem[] }
  importHistory: (data: { history: HistoryItem[] }) => void

  // Token management
  tokens: Cryptocurrency[]
  updateToken: (token: Cryptocurrency) => void
  addToken: (token: Cryptocurrency) => void
  deleteToken: (id: string) => void
  resetTokensToDefault: () => void
  setTokens: (tokens: Cryptocurrency[]) => void

  // Denylist management
  deniedTokens: string[] // Array of token IDs that should not be shown
  toggleDenyToken: (id: string) => void
  resetDenylist: () => void

  // Temporary denylist management (for tokens that received 0% allocation)
  tempDeniedTokens: TempDeniedToken[]
  decrementTempDenylistCounters: () => void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // History management
      history: [],
      addToHistory: (item) =>
        set((state) => {
          // Check if any token received 0% allocation and add it to the temp denylist
          let updatedTempDeniedTokens = [...state.tempDeniedTokens];

          if (item.crypto1AllocationPercent === 0) {
            // Crypto1 got 0% allocation, add to temp denylist if not already there
            if (!updatedTempDeniedTokens.some(t => t.id === item.crypto1.id)) {
              updatedTempDeniedTokens.push({
                id: item.crypto1.id,
                iterationsLeft: 50
              });
            }
          } else if (item.crypto1AllocationPercent === 100) {
            // Crypto2 got 0% allocation, add to temp denylist if not already there
            if (!updatedTempDeniedTokens.some(t => t.id === item.crypto2.id)) {
              updatedTempDeniedTokens.push({
                id: item.crypto2.id,
                iterationsLeft: 50
              });
            }
          }

          return {
            history: [item, ...state.history],
            tempDeniedTokens: updatedTempDeniedTokens
          };
        }),
      updateHistory: (id, item) =>
        set((state) => {
          // Check if any token received 0% allocation and add it to the temp denylist
          let updatedTempDeniedTokens = [...state.tempDeniedTokens];

          if (item.crypto1AllocationPercent === 0) {
            // Crypto1 got 0% allocation, add to temp denylist if not already there
            if (!updatedTempDeniedTokens.some(t => t.id === item.crypto1.id)) {
              updatedTempDeniedTokens.push({
                id: item.crypto1.id,
                iterationsLeft: 50
              });
            }
          } else if (item.crypto1AllocationPercent === 100) {
            // Crypto2 got 0% allocation, add to temp denylist if not already there
            if (!updatedTempDeniedTokens.some(t => t.id === item.crypto2.id)) {
              updatedTempDeniedTokens.push({
                id: item.crypto2.id,
                iterationsLeft: 50
              });
            }
          }

          return {
            history: state.history.map((h) => (h.id === id ? item : h)),
            tempDeniedTokens: updatedTempDeniedTokens
          };
        }),
      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        })),
      clearHistory: () =>
        set(() => ({
          history: [],
        })),
      exportHistory: () => {
        return { history: [...get().history] };
      },
      importHistory: (data) => {
        if (!data || !Array.isArray(data.history)) {
          throw new Error('Invalid history data format');
        }
        set({ history: data.history });
      },

      // Token management
      tokens: defaultCryptocurrencies,
      updateToken: (token) =>
        set((state) => {
          const updatedTokens = state.tokens.map((t) =>
            t.id === token.id ? token : t
          );

          cryptocurrencies = [...updatedTokens];

          return { tokens: updatedTokens };
        }),
      addToken: (token) =>
        set((state) => {
          if (state.tokens.some((t) => t.id === token.id)) {
            throw new Error(`Token with ID ${token.id} already exists`);
          }

          const updatedTokens = [...state.tokens, token];

          cryptocurrencies = [...updatedTokens];

          return { tokens: updatedTokens };
        }),
      deleteToken: (id) =>
        set((state) => {
          const updatedTokens = state.tokens.filter((t) => t.id !== id);

          cryptocurrencies = [...updatedTokens];

          const updatedHistory = state.history.filter(
            (item) => item.crypto1.id !== id && item.crypto2.id !== id
          );

          return {
            tokens: updatedTokens,
            history: updatedHistory
          };
        }),
      resetTokensToDefault: () =>
        set(() => {
          cryptocurrencies = [...defaultCryptocurrencies];

          return { tokens: defaultCryptocurrencies };
        }),
      setTokens: (tokens) =>
        set(() => {
          cryptocurrencies = [...tokens];

          return { tokens };
        }),

      // Denylist management
      deniedTokens: [],
      toggleDenyToken: (id) =>
        set((state) => {
          let updatedDenylist;

          if (state.deniedTokens.includes(id)) {
            updatedDenylist = state.deniedTokens.filter(tokenId => tokenId !== id);
          } else {
            updatedDenylist = [...state.deniedTokens, id];
          }

          cryptocurrencies = state.tokens.filter(token => !updatedDenylist.includes(token.id));

          return { deniedTokens: updatedDenylist };
        }),
      resetDenylist: () =>
        set((state) => {
          cryptocurrencies = [...state.tokens];

          return { deniedTokens: [] };
        }),

      // Temporary denylist management
      tempDeniedTokens: [],
      decrementTempDenylistCounters: () =>
        set((state) => {
          // Decrement counters and filter out expired entries
          const updatedTempDeniedTokens = state.tempDeniedTokens
            .map(item => ({ ...item, iterationsLeft: item.iterationsLeft - 1 }))
            .filter(item => item.iterationsLeft > 0);

          return { tempDeniedTokens: updatedTempDeniedTokens };
        }),
    }),
    {
      name: "tokenomics-arena-storage",
    },
  ),
)

// Create a promise to track store initialization
let storeInitialized = false;
let initializePromise: Promise<void> | null = null;

// Initialize cryptocurrencies from the store
const initStore = (): Promise<void> => {
  if (storeInitialized) {
    return Promise.resolve();
  }

  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = new Promise<void>((resolve) => {
    const state = useStore.getState();

    if (state.tokens && state.tokens.length > 0) {
      cryptocurrencies = [...state.tokens];
    }

    storeInitialized = true;
    resolve();
  });

  return initializePromise;
};

// Function to ensure store is initialized before using it
export const ensureStoreInitialized = (): Promise<void> => {
  if (typeof window === 'undefined') {
    // Server-side rendering, return resolved promise
    return Promise.resolve();
  }

  return initStore();
};

// Call initStore when the module is loaded
if (typeof window !== 'undefined') {
  initStore();
}
