# Tokenomics Arena - Design Documentation

## Overview

Tokenomics Arena is a web application that helps users discover their ideal cryptocurrency portfolio allocation through intuitive pairwise comparisons. Instead of overwhelming users with complex charts and technical analysis, the platform breaks down the decision-making process into simple choices between two options at a time.

## Core Features

### 1. Arena (Main Interface)
- Presents two random cryptocurrencies for comparison
- Large, interactive slider for allocation decisions
- Visual feedback showing percentage splits
- Optional explanation field for recording decision rationale
- Clear submission flow with confirmation

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
- Portfolio value calculator
- Diversification metrics
- Asset allocation visualization
- Ranked token list based on preferences

### 4. About
- Mission statement
- How-it-works guide
- Newsletter subscription
- Social media connections

## Design Decisions

### Navigation
- Fixed header with consistent navigation
- Clear visual indication of current section
- Logo serves as home button
- Responsive design for all screen sizes

### User Interface

#### Arena Page
- Card-based layout for cryptocurrency pairs
- Large, prominent slider for intuitive interaction
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
- Follows an algorithm iterating towards the preferences of the userpx

```
// Initialize
tokens = unique tokens from history
allocation = {} // Empty map for token allocations

// Initial allocation based on frequency in history
for each token in tokens:
    allocation[token] = (appearances of token in history) / (total token appearances)

// Iterative refinement
alpha = 0.95  // Learning rate (tune as needed)
decay_factor = 0.95  // For time decay
convergence_threshold = 0.0001  // Stop when changes are small
max_iterations = 100  // Safety limit

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
        
        token_a = entry.token_a
        token_b = entry.token_b
        pref_a = entry.preference_a / 100  // As proportion
        pref_b = entry.preference_b / 100
        
        // Current normalized allocations for this pair
        sum_ab = allocation[token_a] + allocation[token_b]
        curr_a_norm = allocation[token_a] / sum_ab
        curr_b_norm = allocation[token_b] / sum_ab
        
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
