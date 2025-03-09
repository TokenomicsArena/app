# Tokenomics Arena

A web application that helps users discover their ideal cryptocurrency portfolio allocation through a series of intuitive pairwise comparisons.

## Overview

Tokenomics Arena simplifies the complex process of building a cryptocurrency portfolio by breaking down decisions into simple choices between two options at a time. Over time, user preferences emerge into a comprehensive portfolio allocation that reflects their unique investment philosophy and risk tolerance.

![Tokenomics Arena](public/placeholder.svg)

## Features

- **Pairwise Comparisons**: Make simple allocation decisions between pairs of cryptocurrencies
- **History Tracking**: Review and edit your past allocation decisions
- **Portfolio Generation**: Automatically generate a suggested portfolio based on your preferences
- **Customizable Algorithm**: Fine-tune the portfolio generation algorithm parameters
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Choose your preferred theme or use system settings

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide](https://lucide.dev/)

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TokenomicsArena/app.git
   cd tokenomics-arena
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `/app`: Next.js app router pages and layouts
- `/components`: Reusable UI components
- `/lib`: Utility functions and state management
- `/public`: Static assets
- `/styles`: Global CSS styles

## How It Works

1. Users are presented with two cryptocurrencies
2. They allocate their hypothetical investment between them using a slider
3. Optionally, they can explain their reasoning
4. After submitting, they continue with new pairs
5. The system builds a portfolio recommendation based on their choices

## Portfolio Algorithm

The portfolio generation algorithm uses a learning-based approach that:

1. Collects all unique tokens from the user's history
2. Initializes allocations based on frequency
3. Refines allocations through iterative adjustments based on user preferences
4. Applies time decay to prioritize more recent decisions
5. Normalizes allocations to ensure they sum to 100%

Users can customize algorithm parameters including:
- Learning rate
- Time decay factor
- Convergence threshold
- Maximum iterations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- UI components from [shadcn/ui](https://ui.shadcn.com/)
