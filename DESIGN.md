# Tokenomics Arena - Design Documentation

## Overview

Tokenomics Arena is a web application that helps users build a cryptocurrency portfolio allocation through simple pairwise comparisons. Instead of overwhelming users with complex charts and technical analysis, the platform breaks down the decision-making process into simple choices between two options at a time.

## Core Features

### 1. Arena (Main Interface)
- Presents two cryptocurrencies for comparison using a smart selection algorithm
- Large, interactive slider for allocation decisions
- Visual feedback showing percentage splits with color coding
- Optional explanation field for recording decision rationale
- Clear submission flow with confirmation
- Edit mode for updating previous selections

### 2. History
- Chronological record of all allocation decisions
- Visual representation of allocations
- Relative timestamps for recent entries ("2 days ago")
- Standard date format (YYYY.MM.DD) for older entries
- Inline notes display
- Edit and delete capabilities
- Mobile-responsive design

### 3. Portfolio
- Aggregated view of allocation preferences
- Asset allocation visualization with progress bars
- Ranked token list based on preferences
- Customizable algorithm parameters:
  - Learning rate
  - Time decay factor
  - Convergence threshold
  - Maximum iterations

### 4. About
- Mission statement
- How-it-works guide
- Social media connections

## Design Decisions

### Navigation
- Fixed header with consistent navigation
- Clear visual indication of current section
- Logo serves as home button
- Responsive design for all screen sizes
- Dark/light mode support

### Theme Support
- System preference detection for theme
- Manual toggle between light and dark modes
- Consistent styling across all components

### User Interface

#### Arena Page
- Card-based layout for cryptocurrency pairs
- Color coding (blue/red) for visual distinction
- Clear call-to-action buttons
- Immediate feedback on allocation changes

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
- Detailed breakdown table
- Real-time calculations based on history
- Follows an algorithm iterating towards the preferences of the user

```
// Initialize
tokens = unique tokens from history
allocation = {} // Empty map for token allocations

// Initial allocation based on frequency in history
for each token in tokens:
    allocation[token] = (appearances of token in history) / (total token appearances)

// Iterative refinement
alpha = 0.9  // Learning rate (user adjustable: 0.1-1.0)
decay_factor = 0.95  // For time decay (user adjustable: 0.5-1.0)
convergence_threshold = 0.0001  // Stop when changes are small (user adjustable: 0.00001-0.01)
max_iterations = 100  // Safety limit (user adjustable: 10-500)

iterations = 0
max_change = 1.0  // Initialize above threshold

while (max_change > convergence_threshold && iterations < max_iterations):
    old_allocation = copy(allocation)  // Store for comparison
    max_change = 0
    
    // Process history entries in chronological order
    // More recent entries get higher weight
    for i from 0 to history.length-1:
        entry = history[i]
        time_weight = decay_factor^(history.length - 1 - i)  // Higher weight for recent entries
        
        token_a = entry.crypto1.id
        token_b = entry.crypto2.id
        pref_a = entry.crypto1AllocationPercent / 100  // As proportion
        pref_b = 1 - pref_a
        
        // Current normalized allocations for this pair
        sum_ab = allocation[token_a] + allocation[token_b]
        if (sum_ab > 0):  // Prevent division by zero
            curr_a_norm = allocation[token_a] / sum_ab
            
            // Calculate adjustment based on difference from preference
            delta_a = (pref_a - curr_a_norm) * alpha * time_weight
            
            // Update allocations
            allocation[token_a] += delta_a * sum_ab
            allocation[token_b] -= delta_a * sum_ab
            
            // Ensure non-negative
            allocation[token_a] = max(0, allocation[token_a])
            allocation[token_b] = max(0, allocation[token_b])
    
    // Normalize to ensure sum = 1
    total = sum(allocation.values())
    for token in allocation:
        allocation[token] /= total
    
    // Check convergence
    for token in allocation:
        change = abs(allocation[token] - old_allocation[token])
        max_change = max(max_change, change)
    
    iterations += 1

// Final allocations are in the allocation map
```

### Data Management

1. State Management
   - Zustand for global state
   - Persistent storage for history
   - Real-time portfolio calculations

2. Data Structure
   ```typescript
   type HistoryItem = {
     id: string
     timestamp: Date
     crypto1: Cryptocurrency
     crypto2: Cryptocurrency
     crypto1AllocationPercent: number
     explanation: string
   }

## Smart Pair Selection

The application uses an algorithm to determine which cryptocurrency pairs to present to the user. A fundamental rule is that **the same pair of cryptocurrencies is never shown twice** - once users have compared a specific pair, they will never see that exact pair again.

This algorithm could use some serious tweaking.

### Pair Exhaustion Handling

- When all possible unique pairs have been compared, the application notifies the user that all combinations have been completed (hardly will ever happen)
- The user is then redirected to the History page to review their selections
- This ensures users always make fresh comparisons and prevents redundant decision-making

### Selection Strategies

When selecting new pairs (that haven't been compared before), the algorithm uses these weighted strategies:

1. **Explore New Tokens** (30% weight)
   - Prioritizes tokens the user hasn't seen before
   - Pairs new tokens with frequently compared ones

2. **Refine Preferred Tokens** (40% weight)
   - Focuses on high-preference tokens
   - Helps refine allocations for tokens the user already likes

3. **Reconsider Low-Preference Tokens** (15% weight)
   - Occasionally shows low-preference tokens
   - Gives users a chance to reconsider previous decisions

4. **Random Selection** (15% weight)
   - Pure randomness component
   - Ensures diversity in comparisons

### Algorithm Parameters

- **Minimum Comparisons**: Number of times a token should be compared before reducing its "new" status
- **Maximum Preference Bias**: Prevents always picking the same top tokens
- **Low Preference Penalty**: Controls how quickly low-preference tokens reduce in frequency
- **Time Decay**: More recent comparisons have more influence

### Pair Tracking

- The system maintains a comprehensive record of all previously compared pairs
- Each comparison is tracked regardless of the order of tokens (A-B is considered the same as B-A)
- Before presenting a new pair, the system verifies it hasn't been shown before
