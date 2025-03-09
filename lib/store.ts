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
  
  // Filter out denied tokens
  const availableTokens = cryptocurrencies.filter(token => !deniedTokens.includes(token.id));
  
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

// Define weights for different selection strategies
const WEIGHTS = {
  EXPLORE_NEW: 0.3,      // Prioritize tokens never seen before
  REFINE_PREFERRED: 0.4, // Prioritize high preference tokens
  RECONSIDER_LOW: 0.15,  // Ensure low preference tokens still appear occasionally
  RANDOM: 0.15           // Pure randomness component
};

/**
 * Calculate token statistics based on history
 */
const calculateTokenStats = (
  tokens: Cryptocurrency[],
  history: HistoryItem[]
): Record<string, {
  comparisonCount: number,
  lastCompared: Date | null,
  averagePreference: number,
  allocation: number
}> => {
  const stats: Record<string, any> = {};
  
  // Initialize stats for all tokens
  tokens.forEach(token => {
    stats[token.id] = {
      comparisonCount: 0,
      lastCompared: null,
      averagePreference: 0,
      allocation: 0
    };
  });
  
  // Create allocation map
  const allocations: Record<string, number> = {};
  tokens.forEach(token => { allocations[token.id] = 0; });
  
  // Process history to update stats
  const timeDecay = 0.9;
  
  history.forEach((entry, index) => {
    const timeWeight = Math.pow(timeDecay, history.length - 1 - index);
    
    // Update token 1 stats
    const token1 = entry.crypto1.id;
    if (stats[token1]) {
      stats[token1].comparisonCount++;
      stats[token1].lastCompared = entry.timestamp;
      stats[token1].averagePreference = (
        (stats[token1].averagePreference * (stats[token1].comparisonCount - 1) + 
        entry.crypto1AllocationPercent) / stats[token1].comparisonCount
      );
      
      // Update allocations
      allocations[token1] = (allocations[token1] || 0) + entry.crypto1AllocationPercent * timeWeight;
    }
    
    // Update token 2 stats
    const token2 = entry.crypto2.id;
    if (stats[token2]) {
      stats[token2].comparisonCount++;
      stats[token2].lastCompared = entry.timestamp;
      stats[token2].averagePreference = (
        (stats[token2].averagePreference * (stats[token2].comparisonCount - 1) + 
        (100 - entry.crypto1AllocationPercent)) / stats[token2].comparisonCount
      );
      
      // Update allocations
      allocations[token2] = (allocations[token2] || 0) + (100 - entry.crypto1AllocationPercent) * timeWeight;
    }
  });
  
  // Normalize allocations to sum to 100
  const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  if (totalAllocation > 0) {
    Object.keys(allocations).forEach(key => {
      allocations[key] = (allocations[key] / totalAllocation) * 100;
      if (stats[key]) {
        stats[key].allocation = allocations[key];
      }
    });
  }
  
  return stats;
};

/**
 * Select a pair focusing on unexplored tokens
 */
const selectNewTokenPair = async (
  newTokens: Cryptocurrency[],
  seenTokens: Cryptocurrency[]
): Promise<[Cryptocurrency, Cryptocurrency] | null> => {
  // Pick a random new token
  const newToken = newTokens[Math.floor(Math.random() * newTokens.length)];
  
  if (seenTokens.length === 0) {
    // If this is one of the first comparisons, just pick two new tokens
    const secondNewToken = newTokens.find(t => t.id !== newToken.id) || 
      newTokens[Math.floor(Math.random() * newTokens.length)];
    return [newToken, secondNewToken];
  }
  
  // Try to find tokens that haven't been paired with this new token
  const validTokens = [];
  for (const token of seenTokens) {
    const isPaired = await isPairSelected(newToken.id, token.id);
    if (!isPaired) {
      validTokens.push(token);
    }
  }
  
  if (validTokens.length > 0) {
    return [newToken, validTokens[Math.floor(Math.random() * validTokens.length)]];
  }
  
  // If all tokens have been paired with this new token, try another new token
  const otherNewTokens = newTokens.filter(token => token.id !== newToken.id);
  if (otherNewTokens.length > 0) {
    return selectNewTokenPair(otherNewTokens, seenTokens);
  }
  
  // Fallback to any seen token
  return [newToken, seenTokens[Math.floor(Math.random() * seenTokens.length)]];
};

/**
 * Smart pair selection that balances exploration and preference refinement
 */
export const getSmartPair = async (): Promise<[Cryptocurrency, Cryptocurrency] | null> => {
  // Ensure store is initialized before proceeding
  await ensureStoreInitialized();
  
  const store = useStore.getState();
  const history = store.history;
  const deniedTokens = store.deniedTokens;
  
  // Filter out denied tokens
  const availableTokens = cryptocurrencies.filter(token => !deniedTokens.includes(token.id));
  
  // Check if we have enough tokens
  if (availableTokens.length < 2) {
    console.warn("Not enough tokens available after filtering denylist. Resetting denylist.");
    store.resetDenylist();
    return getSmartPair(); // Try again with reset blacklist
  }
  
  // Check if all possible pairs have been selected
  const allPairsAreSelected = await allPairsSelected();
  if (allPairsAreSelected) {
    // Use the least recently compared pair
    return selectLeastRecentlyComparedPair(availableTokens);
  }
  
  // Calculate token statistics from history
  const tokenStats = calculateTokenStats(availableTokens, history);
  
  // Sort tokens into categories
  const newTokens = availableTokens.filter(token => 
    !tokenStats[token.id] || tokenStats[token.id].comparisonCount === 0
  );
  const seenTokens = availableTokens.filter(token => 
    tokenStats[token.id] && tokenStats[token.id].comparisonCount > 0
  );
  
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
  
  // If no valid pairs, use least recently compared
  if (validPairs.length === 0) {
    return selectLeastRecentlyComparedPair(availableTokens);
  }
  
  // Selection strategy based on weights
  const randomValue = Math.random();
  
  // STRATEGY 1: Explore new tokens (if any exist)
  if (randomValue < WEIGHTS.EXPLORE_NEW && newTokens.length > 0) {
    const newPair = await selectNewTokenPair(newTokens, seenTokens);
    if (newPair) return newPair;
  }
  
  // STRATEGY 2-4: Just use a random valid pair that hasn't been compared yet
  return validPairs[Math.floor(Math.random() * validPairs.length)];
}

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
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // History management
      history: [],
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
