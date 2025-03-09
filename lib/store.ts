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

// Default cryptocurrency data - populated from the imported JSON
export const defaultCryptocurrencies: Cryptocurrency[] = cryptoData as Cryptocurrency[];

// This will be populated from the store
export let cryptocurrencies: Cryptocurrency[] = [...defaultCryptocurrencies]

// Type for history items
export type HistoryItem = {
  id: string
  timestamp: Date
  crypto1: (typeof cryptocurrencies)[0]
  crypto2: (typeof cryptocurrencies)[0]
  crypto1AllocationPercent: number  // Percentage allocated to crypto1
  explanation: string
}

// Get two random cryptocurrencies (simple version without history)
export const getRandomPair = () => {
  const shuffled = [...cryptocurrencies].sort(() => 0.5 - Math.random())
  return [shuffled[0], shuffled[1]]
}

// Calculate the total number of possible pairs
export const getTotalPossiblePairs = (): number => {
  const n = cryptocurrencies.length
  // Formula for combinations: n choose 2 = n! / (2! * (n-2)!) = n * (n-1) / 2
  return (n * (n - 1)) / 2
}

// Get a normalized pair key (order-independent)
export const getNormalizedPairKey = (id1: string, id2: string): string => {
  return [id1, id2].sort().join('-')
}

// Check if all possible pairs have been selected
export const allPairsSelected = (): boolean => {
  const store = useStore.getState()
  const history = store.history
  
  // Create a set of unique pairs (regardless of order)
  const uniquePairs = new Set<string>()
  
  history.forEach(item => {
    uniquePairs.add(getNormalizedPairKey(item.crypto1.id, item.crypto2.id))
  })
  
  return uniquePairs.size >= getTotalPossiblePairs()
}

// Check if a specific pair has been selected before
export const isPairSelected = (id1: string, id2: string): boolean => {
  const store = useStore.getState()
  const history = store.history
  
  const normalizedKey = getNormalizedPairKey(id1, id2)
  
  return history.some(item => 
    getNormalizedPairKey(item.crypto1.id, item.crypto2.id) === normalizedKey
  )
}

// Define weights for different selection strategies
const WEIGHTS = {
  // Prioritize tokens never seen before
  EXPLORE_NEW: 0.3,
  // Prioritize high preference tokens
  REFINE_PREFERRED: 0.4,
  // Ensure low preference tokens still appear occasionally
  RECONSIDER_LOW: 0.15,
  // Pure randomness component
  RANDOM: 0.15
};

// Configuration parameters
const config = {
  // Minimum number of times a token should be compared before reducing its "new" status weight
  MIN_COMPARISONS: 3,
  // Maximum bias towards high-preference tokens (prevents always picking the same top tokens)
  MAX_PREFERENCE_BIAS: 0.8,
  // How quickly low-preference tokens reduce in frequency (higher = appear less often)
  LOW_PREFERENCE_PENALTY: 0.7,
  // Time decay factor (more recent comparisons have more influence)
  TIME_DECAY: 0.9
};

/**
 * Calculate statistics for each token based on history
 * @param tokens - All available tokens
 * @param history - Previous comparison history
 * @param currentAllocations - Current portfolio allocations
 * @returns Stats for each token
 */
const calculateTokenStats = (
  tokens: typeof cryptocurrencies,
  history: HistoryItem[],
  currentAllocations: Record<string, number>
): Record<string, {
  comparisonCount: number,
  lastCompared: Date | null,
  averagePreference: number,
  pairHistory: Record<string, boolean>,
  allocation: number
}> => {
  const stats: Record<string, any> = {};
  
  // Initialize stats for all tokens
  tokens.forEach(token => {
    stats[token.id] = {
      comparisonCount: 0,
      lastCompared: null,
      averagePreference: 0,
      pairHistory: {},  // Will store IDs of tokens this one has been compared with
      allocation: currentAllocations[token.id] || 0
    };
  });
  
  // Process history to update stats
  history.forEach((entry, index) => {
    const timeWeight = Math.pow(config.TIME_DECAY, history.length - 1 - index);
    
    // Update token 1 stats
    const token1 = entry.crypto1.id;
    if (stats[token1]) {
      stats[token1].comparisonCount++;
      stats[token1].lastCompared = entry.timestamp;
      // Update running average of preference
      stats[token1].averagePreference = (
        (stats[token1].averagePreference * (stats[token1].comparisonCount - 1) + 
        entry.crypto1AllocationPercent) / stats[token1].comparisonCount
      );
      
      // Mark that these tokens have been compared together
      stats[token1].pairHistory[entry.crypto2.id] = true;
    }
    
    // Update token 2 stats
    const token2 = entry.crypto2.id;
    if (stats[token2]) {
      stats[token2].comparisonCount++;
      stats[token2].lastCompared = entry.timestamp;
      // Update running average of preference
      stats[token2].averagePreference = (
        (stats[token2].averagePreference * (stats[token2].comparisonCount - 1) + 
        (100 - entry.crypto1AllocationPercent)) / stats[token2].comparisonCount
      );
      
      // Mark that these tokens have been compared together
      stats[token2].pairHistory[entry.crypto1.id] = true;
    }
  });
  
  return stats;
};

/**
 * Select a pair with at least one new token
 */
const selectNewTokenPair = (
  newTokens: typeof cryptocurrencies,
  seenTokens: typeof cryptocurrencies,
  tokenStats: Record<string, any>
): [(typeof cryptocurrencies)[0], (typeof cryptocurrencies)[0]] | null => {
  // Pick a random new token
  const newToken = newTokens[Math.floor(Math.random() * newTokens.length)];
  
  if (seenTokens.length === 0) {
    // If this is one of the first comparisons, just pick two new tokens
    const secondNewToken = newTokens.find(t => t.id !== newToken.id) || newToken;
    return [newToken, secondNewToken];
  }
  
  // Sort seen tokens by comparison count (descending)
  const sortedSeenTokens = [...seenTokens].sort((a, b) => 
    tokenStats[b.id].comparisonCount - tokenStats[a.id].comparisonCount
  );
  
  // Pick from the top 3 most compared tokens with a bias toward the very top
  const topIndex = Math.min(
    Math.floor(Math.random() * Math.random() * 3),
    sortedSeenTokens.length - 1
  );
  
  return [newToken, sortedSeenTokens[topIndex]];
};

/**
 * Select a pair focusing on high preference tokens
 */
const selectHighPreferencePair = (
  tokens: typeof cryptocurrencies,
  tokenStats: Record<string, any>
): [(typeof cryptocurrencies)[0], (typeof cryptocurrencies)[0]] | null => {
  // Filter to tokens that have been seen enough times
  const eligibleTokens = tokens.filter(
    token => tokenStats[token.id] && tokenStats[token.id].comparisonCount >= config.MIN_COMPARISONS
  );
  
  if (eligibleTokens.length < 2) {
    return selectRandomPair(tokens);
  }
  
  // Sort by allocation/preference (descending)
  const sortedTokens = [...eligibleTokens].sort((a, b) => 
    tokenStats[b.id].allocation - tokenStats[a.id].allocation
  );
  
  // Select a high preference token with some randomness
  // This uses a weighted random selection that favors higher-ranked tokens
  const topTokenIndex = Math.floor(
    Math.pow(Math.random(), 1.5) * Math.min(sortedTokens.length, 5)
  );
  const topToken = sortedTokens[topTokenIndex];
  
  // Find tokens that haven't been compared with the selected top token
  const pairCandidates = sortedTokens.filter(token => 
    token.id !== topToken.id && 
    !tokenStats[topToken.id].pairHistory[token.id]
  );
  
  // If there are good candidates, use one of them
  if (pairCandidates.length > 0) {
    const secondToken = pairCandidates[Math.floor(Math.random() * pairCandidates.length)];
    return [topToken, secondToken];
  }
  
  // Otherwise just pick another token that isn't the same
  const otherTokens = sortedTokens.filter(token => token.id !== topToken.id);
  const secondToken = otherTokens[Math.floor(Math.random() * otherTokens.length)];
  
  return [topToken, secondToken];
};

/**
 * Select a pair that includes at least one low preference token
 */
const selectLowPreferencePair = (
  tokens: typeof cryptocurrencies,
  tokenStats: Record<string, any>
): [(typeof cryptocurrencies)[0], (typeof cryptocurrencies)[0]] | null => {
  // Only consider tokens with sufficient comparisons
  const eligibleTokens = tokens.filter(
    token => tokenStats[token.id] && tokenStats[token.id].comparisonCount >= config.MIN_COMPARISONS
  );
  
  if (eligibleTokens.length < 2) {
    return selectRandomPair(tokens);
  }
  
  // Sort by preference (ascending - lowest first)
  const sortedTokens = [...eligibleTokens].sort((a, b) => 
    tokenStats[a.id].allocation - tokenStats[b.id].allocation
  );
  
  // Use inverse-square weighting to make lowest preference tokens more likely
  // But not guaranteed to be selected
  const lowTokenIndex = Math.floor(
    Math.pow(Math.random(), 2) * Math.min(sortedTokens.length, 5)
  );
  
  const lowToken = sortedTokens[lowTokenIndex];
  
  // For the second token, prefer one with higher preference
  // but that hasn't been compared with the low token
  const highTokens = tokens.filter(token => 
    token.id !== lowToken.id && 
    !tokenStats[lowToken.id].pairHistory[token.id] &&
    tokenStats[token.id] && 
    tokenStats[token.id].allocation > tokenStats[lowToken.id].allocation
  );
  
  if (highTokens.length > 0) {
    return [lowToken, highTokens[Math.floor(Math.random() * highTokens.length)]];
  }
  
  // Fallback to any non-same token
  const otherTokens = tokens.filter(token => token.id !== lowToken.id);
  const secondToken = otherTokens[Math.floor(Math.random() * otherTokens.length)];
  
  return [lowToken, secondToken];
};

/**
 * Select a completely random pair of tokens that haven't been compared before
 */
const selectRandomPair = (
  tokens: typeof cryptocurrencies,
  tokenStats: Record<string, any> | null = null
): [(typeof cryptocurrencies)[0], (typeof cryptocurrencies)[0]] | null => {
  if (tokens.length < 2) {
    throw new Error("Need at least two tokens for comparison");
  }
  
  // If we have stats, use them to avoid repeated comparisons
  if (tokenStats) {
    // Find all valid pairs that haven't been compared yet
    const validPairs: [(typeof cryptocurrencies)[0], (typeof cryptocurrencies)[0]][] = [];
    
    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        const token1 = tokens[i];
        const token2 = tokens[j];
        
        // Check if these tokens have been compared before (in either order)
        const haveBeenCompared = 
          (tokenStats[token1.id]?.pairHistory[token2.id]) || 
          (tokenStats[token2.id]?.pairHistory[token1.id]);
        
        if (!haveBeenCompared) {
          validPairs.push([token1, token2]);
        }
      }
    }
    
    // If we found valid pairs, choose one randomly
    if (validPairs.length > 0) {
      return validPairs[Math.floor(Math.random() * validPairs.length)];
    }
    
    // If no valid pairs, return null to indicate all pairs have been exhausted
    console.warn("No unique token pairs available. All tokens have been compared with each other.");
    return null;
  }
  
  // Fallback or no stats provided - just pick two different tokens
  const firstIndex = Math.floor(Math.random() * tokens.length);
  const firstToken = tokens[firstIndex];
  
  let secondIndex;
  do {
    secondIndex = Math.floor(Math.random() * tokens.length);
  } while (secondIndex === firstIndex);
  
  const secondToken = tokens[secondIndex];
  
  return [firstToken, secondToken];
};

/**
 * Check if there are any valid pairs of tokens that haven't been compared
 */
const checkForValidPairs = (
  tokens: typeof cryptocurrencies,
  tokenStats: Record<string, any>
): boolean => {
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const token1 = tokens[i];
      const token2 = tokens[j];
      
      // Check if these tokens have been compared before (in either order)
      const haveBeenCompared = 
        (tokenStats[token1.id]?.pairHistory[token2.id]) || 
        (tokenStats[token2.id]?.pairHistory[token1.id]);
      
      if (!haveBeenCompared) {
        return true; // Found at least one valid pair
      }
    }
  }
  
  return false; // No valid pairs found
};

/**
 * Select the pair of tokens that was compared least recently
 * Used as a fallback when all tokens have been compared with each other
 */
const selectLeastRecentlyComparedPair = (
  tokens: typeof cryptocurrencies,
  tokenStats: Record<string, any>
): [(typeof cryptocurrencies)[0], (typeof cryptocurrencies)[0]] => {
  let oldestPair: [(typeof cryptocurrencies)[0], (typeof cryptocurrencies)[0]] | null = null;
  let oldestTimestamp = Date.now();
  
  // This is a fallback approach where we're going to recompare tokens
  // Find the pair that was compared longest ago
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const token1 = tokens[i];
      const token2 = tokens[j];
      
      // Find when this pair was last compared by looking at both tokens' last comparison dates
      // with the current partner
      const token1LastComparedWithToken2 = findLastComparisonTimestamp(tokenStats, token1.id, token2.id);
      const token2LastComparedWithToken1 = findLastComparisonTimestamp(tokenStats, token2.id, token1.id);
      
      // Use the more recent of the two timestamps
      const pairLastCompared = Math.max(token1LastComparedWithToken2, token2LastComparedWithToken1);
      
      if (pairLastCompared < oldestTimestamp) {
        oldestTimestamp = pairLastCompared;
        oldestPair = [token1, token2];
      }
    }
  }
  
  return oldestPair || [tokens[0], tokens[1]]; // Fallback to first two tokens if needed
};

/**
 * Find when token1 was last compared with token2 based on history
 */
const findLastComparisonTimestamp = (
  tokenStats: Record<string, any>,
  token1Id: string,
  token2Id: string
): number => {
  // This is a simplified approach - in a real implementation you'd need to store
  // the actual comparison timestamps for each pair in your history
  
  // For now, we'll use the last compared timestamp of each token as a proxy
  if (tokenStats[token1Id] && tokenStats[token1Id].lastCompared) {
    return new Date(tokenStats[token1Id].lastCompared).getTime();
  }
  return 0;
};

/**
 * Get two cryptocurrencies, using the smart selection algorithm
 * This function will be used after the store is initialized
 */
export const getSmartPair = (): [(typeof cryptocurrencies)[0], (typeof cryptocurrencies)[0]] | null => {
  // Get the store to access history
  const store = useStore.getState();
  const history = store.history;

  // Check if all possible pairs have been selected
  if (allPairsSelected()) {
    // Return null to indicate all pairs have been exhausted
    return null;
  }
  
  // Calculate current allocations from history
  // This is a simplified approach - in a real app, you might have a more sophisticated
  // way to calculate current allocations based on user preferences
  const currentAllocations: Record<string, number> = {};
  
  // Initialize allocations to 0
  cryptocurrencies.forEach(crypto => {
    currentAllocations[crypto.id] = 0;
  });
  
  // Update allocations based on history (more recent entries have more weight)
  history.forEach((entry, index) => {
    const timeWeight = Math.pow(config.TIME_DECAY, history.length - 1 - index);
    
    // Update allocations based on this entry
    currentAllocations[entry.crypto1.id] = 
      (currentAllocations[entry.crypto1.id] || 0) + entry.crypto1AllocationPercent * timeWeight;
    
    currentAllocations[entry.crypto2.id] = 
      (currentAllocations[entry.crypto2.id] || 0) + (100 - entry.crypto1AllocationPercent) * timeWeight;
  });
  
  // Normalize allocations to sum to 100
  const totalAllocation = Object.values(currentAllocations).reduce((sum, val) => sum + val, 0);
  if (totalAllocation > 0) {
    Object.keys(currentAllocations).forEach(key => {
      currentAllocations[key] = (currentAllocations[key] / totalAllocation) * 100;
    });
  }
  
  // Calculate token statistics from history
  const tokenStats = calculateTokenStats(cryptocurrencies, history, currentAllocations);
  
  // Sort tokens into categories
  const newTokens = cryptocurrencies.filter(token => !tokenStats[token.id] || tokenStats[token.id].comparisonCount === 0);
  const seenTokens = cryptocurrencies.filter(token => tokenStats[token.id] && tokenStats[token.id].comparisonCount > 0);
  
  // Selection strategy based on weights
  const randomValue = Math.random();
  
  // Check if we have any valid pairs left at all
  const hasValidPairs = checkForValidPairs(cryptocurrencies, tokenStats);
  
  if (!hasValidPairs) {
    console.warn("All possible token pairs have been compared. Consider adding new tokens or resetting history.");
    // Return null to indicate all pairs have been exhausted
    return null;
  }
  
  // STRATEGY 1: Explore new tokens (if any exist)
  if (randomValue < WEIGHTS.EXPLORE_NEW && newTokens.length > 0) {
    return selectNewTokenPair(newTokens, seenTokens, tokenStats);
  } 
  // STRATEGY 2: Refine high preference tokens
  else if (randomValue < WEIGHTS.EXPLORE_NEW + WEIGHTS.REFINE_PREFERRED) {
    return selectHighPreferencePair(cryptocurrencies, tokenStats);
  }
  // STRATEGY 3: Reconsider low preference tokens
  else if (randomValue < WEIGHTS.EXPLORE_NEW + WEIGHTS.REFINE_PREFERRED + WEIGHTS.RECONSIDER_LOW) {
    return selectLowPreferencePair(cryptocurrencies, tokenStats);
  }
  // STRATEGY 4: Pure random selection (fallback)
  else {
    return selectRandomPair(cryptocurrencies, tokenStats);
  }
};

// Sample history data
const sampleHistory: HistoryItem[] = []

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
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // History management
      history: sampleHistory,
      addToHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history],
        })),
      updateHistory: (id, item) =>
        set((state) => ({
          history: state.history.map((h) => (h.id === id ? item : h)),
        })),
      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        })),
      clearHistory: () =>
        set(() => ({
          history: [],
        })),
      exportHistory: () => {
        // Return a copy of the history data
        return { history: [...get().history] };
      },
      importHistory: (data) => {
        // Validate the data structure
        if (!data || !Array.isArray(data.history)) {
          throw new Error('Invalid history data format');
        }
        
        // Replace the entire history with the imported data
        set({ history: data.history });
      },
      
      // Token management
      tokens: defaultCryptocurrencies,
      updateToken: (token) =>
        set((state) => {
          const updatedTokens = state.tokens.map((t) => 
            t.id === token.id ? token : t
          );
          
          // Update the exported cryptocurrencies array
          cryptocurrencies = [...updatedTokens];
          
          return { tokens: updatedTokens };
        }),
      addToken: (token) =>
        set((state) => {
          // Check if token with this ID already exists
          if (state.tokens.some((t) => t.id === token.id)) {
            throw new Error(`Token with ID ${token.id} already exists`);
          }
          
          const updatedTokens = [...state.tokens, token];
          
          // Update the exported cryptocurrencies array
          cryptocurrencies = [...updatedTokens];
          
          return { tokens: updatedTokens };
        }),
      deleteToken: (id) =>
        set((state) => {
          const updatedTokens = state.tokens.filter((t) => t.id !== id);
          
          // Update the exported cryptocurrencies array
          cryptocurrencies = [...updatedTokens];
          
          // Filter history to remove entries with this token
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
          // Update the exported cryptocurrencies array
          cryptocurrencies = [...defaultCryptocurrencies];
          
          return { tokens: defaultCryptocurrencies };
        }),
      setTokens: (tokens) =>
        set(() => {
          // Update the exported cryptocurrencies array
          cryptocurrencies = [...tokens];
          
          return { tokens };
        }),
    }),
    {
      name: "tokenomics-arena-storage",
    },
  ),
)

// Initialize cryptocurrencies from the store
// This ensures that the exported cryptocurrencies array is always in sync with the store
const initStore = () => {
  const state = useStore.getState();
  
  // If tokens are already in the store, use them
  if (state.tokens && state.tokens.length > 0) {
    cryptocurrencies = [...state.tokens];
  }
};

// Call initStore when the module is loaded
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(initStore, 0);
}
