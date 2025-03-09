#!/usr/bin/env node

/**
 * CoinMarketCap Scraper
 * 
 * This script fetches real cryptocurrency data from the CoinMarketCap API.
 * It includes:
 * - Token name, symbol, and ID
 * - Current price
 * - Market cap
 * - Logo as base64-encoded PNG or placeholder
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  // Number of cryptocurrencies to include
  numTokens: 250,
  // Output file path
  outputFile: path.join(__dirname, '../public/coinmarketcap-data.json'),
  // Delay between API requests (ms)
  apiDelay: 500,
  // CoinMarketCap API base URL
  apiBaseUrl: 'https://pro-api.coinmarketcap.com',
  // CoinMarketCap API key - can be passed as environment variable CMC_API_KEY
  apiKey: process.env.CMC_API_KEY || '',
};

/**
 * Sleep for a specified number of milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make an API request to CoinMarketCap
 */
const makeApiRequest = (endpoint, params = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${CONFIG.apiBaseUrl}${endpoint}`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    
    const options = {
      headers: {
        'X-CMC_PRO_API_KEY': CONFIG.apiKey,
        'Accept': 'application/json'
      }
    };
    
    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`API request failed with status code ${response.statusCode}`));
        return;
      }
      
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
};

/**
 * Download an image and convert it to base64
 */
const imageToBase64 = async (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        const mimeType = response.headers['content-type'] || 'image/png';
        resolve(`data:${mimeType};base64,${base64}`);
      });
      response.on('error', reject);
    }).on('error', reject);
  });
};

/**
 * Fetch cryptocurrency data from CoinMarketCap API
 */
async function fetchTokenData() {
  // Check if API key is provided
  if (!CONFIG.apiKey) {
    console.error('Error: CoinMarketCap API key is required.');
    console.error('Please set the CMC_API_KEY environment variable.');
    console.error('Example: CMC_API_KEY=your_api_key node scripts/scrape-coinmarketcap.js');
    process.exit(1);
  }

  console.log('Fetching cryptocurrency data from CoinMarketCap API...');
  
  try {
    // Fetch the latest listings with pagination if needed
    // CoinMarketCap API has a maximum limit of 100 per request for most plans
    const maxPerRequest = 100;
    let allTokens = [];
    let start = 1;
    
    while (allTokens.length < CONFIG.numTokens) {
      const limit = Math.min(maxPerRequest, CONFIG.numTokens - allTokens.length);
      console.log(`Fetching tokens ${start} to ${start + limit - 1}...`);
      
      const listingsResponse = await makeApiRequest('/v1/cryptocurrency/listings/latest', {
        start: start,
        limit: limit,
        convert: 'USD'
      });
      
      if (!listingsResponse.data || listingsResponse.data.length === 0) {
        console.log('No more tokens available from the API.');
        break;
      }
      
      const batchTokens = listingsResponse.data.map(token => ({
        id: token.slug,
        name: token.name,
        symbol: token.symbol,
        price: token.quote.USD.price,
        marketCap: token.quote.USD.market_cap,
        cmcId: token.id // We'll need this to fetch the logo
      }));
      
      allTokens = [...allTokens, ...batchTokens];
      start += limit;
      
      // Add a delay between pagination requests to avoid rate limiting
      if (allTokens.length < CONFIG.numTokens) {
        await sleep(CONFIG.apiDelay);
      }
    }
    
    const tokens = allTokens.slice(0, CONFIG.numTokens);
    console.log(`Successfully fetched ${tokens.length} tokens from the API.`);
    
    // Process tokens with logos
    console.log('Processing token logos...');
    const tokensWithBase64Logos = [];
    
    // CoinMarketCap API may have limitations on how many IDs can be included in a single metadata request
    // Process in batches of 100 to be safe
    const metadataBatchSize = 100;
    
    for (let i = 0; i < tokens.length; i += metadataBatchSize) {
      const batchTokens = tokens.slice(i, i + metadataBatchSize);
      const batchIds = batchTokens.map(token => token.cmcId).join(',');
      
      console.log(`Fetching metadata for tokens ${i+1} to ${Math.min(i + metadataBatchSize, tokens.length)}...`);
      
      // Fetch metadata (including logos) for this batch
      const metadataResponse = await makeApiRequest('/v1/cryptocurrency/info', {
        id: batchIds
      });
      
      // Process each token in this batch
      for (let j = 0; j < batchTokens.length; j++) {
        const token = batchTokens[j];
        console.log(`Processing ${i+j+1}/${tokens.length}: ${token.name} (${token.symbol})`);
        
        try {
          const metadata = metadataResponse.data[token.cmcId];
          const logoUrl = metadata?.logo || '';
          
          if (logoUrl && logoUrl.startsWith('http')) {
            try {
              token.logo = await imageToBase64(logoUrl);
            } catch (error) {
              console.error(`Error downloading logo for ${token.name}: ${error.message}`);
              token.logo = '/placeholder.svg?height=80&width=80';
            }
          } else {
            token.logo = '/placeholder.svg?height=80&width=80';
          }
          
          // Remove the temporary cmcId property
          delete token.cmcId;
          
          tokensWithBase64Logos.push(token);
          
          // Add a delay to avoid rate limiting
          if ((i + j) < tokens.length - 1) {
            await sleep(CONFIG.apiDelay);
          }
        } catch (error) {
          console.error(`Error processing ${token.name}: ${error.message}`);
          // Use a placeholder if we can't get the logo
          token.logo = '/placeholder.svg?height=80&width=80';
          delete token.cmcId;
          tokensWithBase64Logos.push(token);
        }
      }
      
      // Add a delay between metadata batch requests to avoid rate limiting
      if (i + metadataBatchSize < tokens.length) {
        await sleep(CONFIG.apiDelay);
      }
    }
    
    // Save the data to a JSON file
    console.log(`Saving data to ${CONFIG.outputFile}...`);
    
    // Create the directory if it doesn't exist
    const dir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(tokensWithBase64Logos, null, 2));
    
    console.log(`Successfully fetched ${tokensWithBase64Logos.length} tokens!`);
    console.log(`Data saved to ${CONFIG.outputFile}`);
  } catch (error) {
    console.error(`Error fetching data from CoinMarketCap API: ${error.message}`);
    process.exit(1);
  }
}

// Run the fetcher
fetchTokenData().catch(console.error);
