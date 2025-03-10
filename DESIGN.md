# Tokenomics Arena - Design Documentation

## Overview

Tokenomics Arena is a web application that helps users build a cryptocurrency portfolio allocation through simple pairwise comparisons. Instead of overwhelming users with complex charts and technical analysis, the platform breaks down the decision-making process into simple choices between two options at a time. The application uses Zustand for state management with persistent storage, ensuring user data is saved between sessions.

## Core Features

### 1. Arena (Main Interface)
- Presents two cryptocurrencies for comparison using a smart selection algorithm
- Large, interactive slider for allocation decisions
- Visual feedback showing percentage splits with color coding (blue/red)
- Optional explanation field for recording decision rationale
- Clear submission flow with confirmation
- Edit mode for updating previous selections
- Ability to deny tokens (remove them from future comparisons)
- Randomize button to get a different pair

### 2. History
- Chronological record of all allocation decisions
- Visual representation of allocations
- Relative timestamps for recent entries ("2 days ago")
- Standard date format (YYYY.MM.DD) for older entries
- Inline notes display
- Edit and delete capabilities
- Mobile-responsive design
- Export and import functionality for backup and transfer
- Ability to scroll to specific entries via URL anchors

### 3. Portfolio
- Aggregated view of allocation preferences
- Asset allocation visualization with progress bars
- Ranked token list based on preferences
- Customizable algorithm parameters:
  - Learning rate (alpha): Controls how quickly allocations adjust (0.1-1.0)
  - Time decay factor: How much newer entries matter compared to older ones (0.5-1.0)
  - Convergence threshold: When change is below this value, simulation stops (0.00001-0.01)
  - Maximum iterations: Safety limit to prevent infinite loops (10-500)
- Ability to recalculate portfolio with adjusted parameters
- Share functionality to generate a URL with portfolio allocation
- Token comparison history badges showing preference relationships

### 4. About
- Mission statement
- How-it-works guide
- Social media connections
- Shown to new users before they make their first selection

## Design Decisions

### Navigation
- Fixed header with consistent navigation
- Clear visual indication of current section
- Logo serves as home button
- Responsive design for all screen sizes
- Dark/light mode support
- Mobile-optimized interface with appropriate sizing

### Theme Support
- System preference detection for theme
- Manual toggle between light and dark modes
- Consistent styling across all components
- Shadcn UI components for consistent design language

### User Interface

#### Arena Page
- Card-based layout for cryptocurrency pairs
- Color coding (blue/red) for visual distinction
- Clear call-to-action buttons
- Immediate feedback on allocation changes
- Ability to deny tokens from future comparisons
- Randomize option for getting different pairs

#### History Page
1. Date Display
   - Relative time for entries less than a week old ("2 days ago")
   - Standard date format (YYYY.MM.DD) for older entries
   - Maintains chronological order

2. Allocation Visualization
   - Merged view combining tokens and allocation
   - Background color indicates split proportion
   - Left side: First token with percentage
   - Right side: Second token with percentage
   - Token symbols included for quick reference

3. Notes
   - Displayed directly under each entry
   - Italic styling for distinction
   - Prefixed with "Note:" for clarity
   - Preserves context with allocation decision

4. Actions
   - Minimal icon-only buttons
   - Tooltip hints on hover
   - Edit and delete functionality
   - Confirmation dialog for destructive actions

#### Portfolio Page
- Card-based metrics for key statistics
- Progress bars for allocation visualization
- Detailed breakdown of token allocations
- Real-time calculations based on history
- Adjustable algorithm parameters with immediate recalculation
- Share functionality to generate a URL with portfolio allocation
- Token comparison badges showing preference relationships

### Data Management

1. State Management
   - Zustand for global state
   - Persistent storage for history and settings
   - Real-time portfolio calculations
   - Hydration handling for server-side rendering

2. Data Structures
   ```typescript
   // Cryptocurrency definition
   type Cryptocurrency = {
     id: string
     name: string
     symbol: string
     logo: string
     price: number
     marketCap?: number
   }

   // History item structure
   type HistoryItem = {
     id: string
     timestamp: Date
     crypto1: Cryptocurrency
     crypto2: Cryptocurrency
     crypto1AllocationPercent: number
     explanation: string
   }

   // Temporary denylisted token
   type TempDeniedToken = {
     id: string
     iterationsLeft: number
   }
   ```

3. Store Features
   - History management (add, update, remove, clear, export, import)
   - Token management (update, add, delete, reset to default)
   - Denylist management (permanent and temporary)
   - Automatic temporary denylisting of tokens that receive 0% allocation

## Smart Pair Selection

The application uses a sophisticated algorithm to determine which cryptocurrency pairs to present to the user. A fundamental rule is that **the same pair of cryptocurrencies is never shown twice** - once users have compared a specific pair, they will never see that exact pair again (unless all possible pairs have been exhausted).

### Pair Exhaustion Handling

- When all possible unique pairs have been compared, the application selects the least recently compared pair
- If no valid pairs can be found after multiple attempts, the system falls back to random selection
- The system tracks all previously compared pairs using a normalized key (order-independent)
- When a user denies too many tokens, the system automatically resets the denylist to ensure enough tokens are available

### Selection Strategies

The smart pair selection algorithm uses multiple strategies based on the user's history and preferences:

1. **New User Experience**
   - For users with less than 30 history entries, prioritizes a predefined list of popular tokens
   - Ensures new users see recognizable cryptocurrencies first

2. **Exploration vs. Refinement**
   - 50% chance to use an unseen token as the first token (if available)
   - 30% chance to use a preferred token (those that received >60% allocation)
   - 20% chance for pure random selection
   - For the second token, balances between unseen and seen tokens

3. **Top Token Refinement**
   - After 30 selections, prioritizes comparing top 10 tokens against each other
   - Focuses on tokens with fewer comparisons to ensure balanced evaluation
   - 70% chance to prioritize top 10 tokens even after all top 10 pairs have been compared

4. **Temporary Denylist**
   - Tokens that receive 0% allocation are temporarily removed from selection for 50 iterations
   - Gradually reintroduces these tokens to give them another chance

### Algorithm Implementation

The pair selection process follows these steps:

1. Filter out denied tokens (both permanent and temporary)
2. Identify tokens the user has seen and those they haven't
3. Determine preferred tokens from recent history (last 10 entries)
4. For users with 30-60 selections, calculate top 10 tokens using the portfolio algorithm
5. Select a first token based on user experience and weighted strategies
6. Find valid candidates for the second token (not previously paired with the first)
7. Select a second token with balanced consideration of unseen vs. seen tokens
8. If no valid pairs are found, fall back to the least recently compared pair

The system also handles special cases:
- When a user denies a token, it's removed from future comparisons
- When a token receives 0% allocation, it's temporarily removed for 50 iterations
- If too many tokens are denied, the denylist is reset to ensure enough tokens are available

### Pair Tracking

- The system maintains a comprehensive record of all previously compared pairs
- Each comparison is tracked regardless of the order of tokens (A-B is considered the same as B-A)
- Normalized pair keys are used to ensure order-independent comparison
- The system calculates the total number of possible pairs based on available tokens
- Before presenting a new pair, the system verifies it hasn't been shown before

## Portfolio Allocation Algorithm

The portfolio allocation algorithm converts pairwise comparisons into a comprehensive portfolio allocation. It uses an iterative approach to find the optimal allocation that best represents the user's preferences.

### Algorithm Steps

1. **Initialization**
   - Collect all unique tokens from history
   - Initialize allocations based on frequency of appearance in history

2. **Iterative Refinement**
   - Process history entries in chronological order
   - Apply time decay to give more weight to recent decisions
   - For each pair comparison, adjust allocations based on the user's preference
   - Normalize allocations to ensure they sum to 100%
   - Check for convergence (when changes become smaller than threshold)

3. **Parameters**
   - Learning rate (alpha): Controls how quickly allocations adjust
   - Time decay factor: Determines how much newer entries matter compared to older ones
   - Convergence threshold: When change is below this value, simulation stops
   - Maximum iterations: Safety limit to prevent infinite loops

### Visualization and Interaction

- Portfolio allocations are displayed as progress bars
- Tokens are ranked by allocation percentage
- Users can adjust algorithm parameters and recalculate in real-time
- Token comparison badges show preference relationships between tokens
- Share functionality generates a URL with the portfolio allocation for sharing

## Token Management

The application provides comprehensive token management capabilities:

1. **Default Tokens**
   - Loaded from a JSON file with cryptocurrency data
   - Includes name, symbol, logo, price, and market cap information

2. **Custom Tokens**
   - Users can add custom tokens with their own metadata
   - Custom tokens are stored in the persistent state

3. **Denylist Management**
   - Permanent denylist: Tokens manually removed by the user
   - Temporary denylist: Tokens that received 0% allocation (removed for 50 iterations)
   - Automatic reset if too many tokens are denied

4. **Token Preferences**
   - System tracks which tokens are preferred based on allocation percentages
   - Tokens receiving >90% allocation are considered "preferred"
   - Preference data influences future pair selection
