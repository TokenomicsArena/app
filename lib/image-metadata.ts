/**
 * Utility functions for embedding and extracting metadata from images
 */
import { embedJSONintoPNG, extractJSONfromPNG } from './png-metadata';

/**
 * Embeds JSON data into an image by creating a pie chart and storing metadata
 * @param portfolioData The portfolio data to visualize
 * @param jsonData The JSON data to embed
 * @returns A Promise that resolves to a data URL of the image with embedded metadata
 */
export async function embedMetadataInImage(
  portfolioData: Array<{ token: { name: string; symbol: string; logo?: string }, percentage: number }>,
  jsonData: any
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log("Starting to embed metadata in image");
      
      // Create a canvas for the chart
      const canvas = document.createElement('canvas');
      const width = 1280;
      const height = 720;
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Draw title
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText('Tokenomics Arena Portfolio Backup', width / 2, 40);
      
      // Draw pie chart
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;
      
      // Define colors for the pie chart
      const colors = [
        '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
        '#8884D8', '#82CA9D', '#A4DE6C', '#D0ED57',
        '#FFA07A', '#20B2AA', '#B0C4DE', '#DDA0DD'
      ];
      
      // Sort portfolio data by percentage (descending)
      const sortedData = [...portfolioData].sort((a, b) => b.percentage - a.percentage);
      
      // Draw the pie chart
      let startAngle = 0;
      let total = sortedData.reduce((sum, item) => sum + item.percentage, 0);
      
      // If total is 0, set a default value to avoid division by zero
      if (total === 0) total = 100;
      
      // Draw each slice
      sortedData.forEach((item, index) => {
        const sliceAngle = (item.percentage / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;
        
        // Draw the slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        // Fill with color
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        
        // Draw slice border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Calculate position for the label
        const midAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + labelRadius * Math.cos(midAngle);
        const labelY = centerY + labelRadius * Math.sin(midAngle);
        
        // Draw percentage if it's significant enough
        if (item.percentage > 3) {
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.round(item.percentage)}%`, labelX, labelY);
        }
        
        startAngle = endAngle;
      });
      
      // Draw legend
      const legendX = 50;
      let legendY = height - 180;
      
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      sortedData.slice(0, 8).forEach((item, index) => {
        // Draw color box
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(legendX, legendY, 20, 20);
        
        // Draw border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, 20, 20);
        
        // Draw text
        ctx.fillStyle = '#000000';
        ctx.fillText(
          `${item.token.name} (${item.token.symbol}): ${item.percentage.toFixed(2)}%`, 
          legendX + 30, 
          legendY + 10
        );
        
        legendY += 30;
      });
      
      // Add a watermark with app name and date
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.textAlign = 'left';
      ctx.fillText(`Tokenomics Arena Backup - ${new Date().toISOString().split('T')[0]}`, 10, height - 10);
      
      // Get the PNG data from the canvas
      const dataUrl = canvas.toDataURL('image/png');
      console.log("Generated PNG image, data URL length:", dataUrl.length);
      
      // Convert data URL to ArrayBuffer
      const base64Data = dataUrl.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const imageBuffer = bytes.buffer;
      
      // Embed JSON data into the PNG
      const pngWithMetadata = embedJSONintoPNG(imageBuffer, jsonData);
      console.log("Embedded metadata into PNG, size:", pngWithMetadata.byteLength);
      
      // Convert back to data URL
      const pngBytes = new Uint8Array(pngWithMetadata);
      let binaryResult = '';
      for (let i = 0; i < pngBytes.length; i++) {
        binaryResult += String.fromCharCode(pngBytes[i]);
      }
      const base64Result = btoa(binaryResult);
      const resultDataUrl = `data:image/png;base64,${base64Result}`;
      
      resolve(resultDataUrl);
    } catch (error) {
      console.error("Error embedding metadata:", error);
      reject(error);
    }
  });
}

/**
 * Extracts JSON metadata from an image
 * @param imageFile The image file to extract metadata from
 * @returns A Promise that resolves to the extracted JSON data
 */
export async function extractMetadataFromImage(imageFile: File): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      console.log("Starting metadata extraction from file:", imageFile.name, "size:", imageFile.size);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        console.log("File read complete");
        
        try {
          if (event.target?.result) {
            // Get the ArrayBuffer from the file
            const arrayBuffer = event.target.result as ArrayBuffer;
            
            // Extract JSON data from PNG metadata
            const jsonData = extractJSONfromPNG(arrayBuffer);
            
            if (jsonData) {
              console.log("Found JSON data in PNG metadata");
              
              // Validate that this is Tokenomics Arena data
              if (jsonData.history && Array.isArray(jsonData.history)) {
                console.log("Valid Tokenomics Arena data found, history items:", jsonData.history.length);
                resolve(jsonData);
                return;
              } else {
                console.error("Invalid data format, missing history array");
                reject(new Error('The metadata in the image was not a valid backup for Tokenomics Arena data'));
                return;
              }
            }
            
            // If we couldn't extract metadata using the PNG chunks method,
            // try the legacy methods for backward compatibility
            
            // Convert ArrayBuffer to data URL for legacy methods
            const uint8Array = new Uint8Array(arrayBuffer);
            let binaryString = '';
            for (let i = 0; i < uint8Array.length; i++) {
              binaryString += String.fromCharCode(uint8Array[i]);
            }
            const base64String = btoa(binaryString);
            const dataUrl = `data:${imageFile.type};base64,${base64String}`;
            
            // Try to parse the file content as JSON (legacy format)
            try {
              const fileContent = dataUrl.split(',')[1]; // Get the base64 part
              const decodedContent = atob(fileContent);
              const legacyJsonData = JSON.parse(decodedContent);
              
              // Check if this is our legacy format with imageDataUrl and metadata
              if (legacyJsonData.imageDataUrl && legacyJsonData.metadata) {
                console.log("Found legacy JSON format with metadata");
                
                // Decode the metadata
                const encodedData = legacyJsonData.metadata;
                const jsonString = decodeURIComponent(atob(encodedData));
                const metadataJson = JSON.parse(jsonString);
                
                // Validate that this is Tokenomics Arena data
                if (metadataJson.history && Array.isArray(metadataJson.history)) {
                  console.log("Valid Tokenomics Arena data found in legacy format, history items:", metadataJson.history.length);
                  resolve(metadataJson);
                  return;
                }
              }
            } catch (jsonError) {
              console.log("Not a legacy JSON format, trying other methods");
            }
            
            // Look for our metadata marker in the data URL (very old legacy format)
            const metadataMarker = "<!--TOKENOMICS_METADATA:";
            const markerIndex = dataUrl.indexOf(metadataMarker);
            
            if (markerIndex !== -1) {
              // Extract the encoded data
              const metadataStart = markerIndex + metadataMarker.length;
              const metadataEnd = dataUrl.indexOf("-->", metadataStart);
              
              if (metadataEnd !== -1) {
                const encodedData = dataUrl.substring(metadataStart, metadataEnd);
                console.log("Found encoded metadata in legacy format, length:", encodedData.length);
                
                // Decode the data
                const jsonString = decodeURIComponent(atob(encodedData));
                console.log("Decoded JSON string, length:", jsonString.length);
                
                const oldJsonData = JSON.parse(jsonString);
                
                // Validate that this is Tokenomics Arena data
                if (oldJsonData.history && Array.isArray(oldJsonData.history)) {
                  console.log("Valid Tokenomics Arena data found in very old legacy format, history items:", oldJsonData.history.length);
                  resolve(oldJsonData);
                  return;
                }
              }
            }
            
            // If we still haven't found valid metadata, reject
            reject(new Error('That image does not have valid metadata'));
          } else {
            console.error("No result from FileReader");
            reject(new Error('Failed to read image file'));
          }
        } catch (error) {
          console.error("Error processing file data:", error);
          reject(new Error('Failed to process image data'));
        }
      };
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error('Failed to read image file'));
      };
      
      // Read the file as an ArrayBuffer
      reader.readAsArrayBuffer(imageFile);
    } catch (error) {
      console.error("Unexpected error in extractMetadataFromImage:", error);
      reject(error);
    }
  });
}

/**
 * Downloads a data URL as a file
 * @param dataUrl The data URL to download
 * @param filename The filename to use
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  try {
    // Check if the dataUrl is our JSON format
    const resultObj = JSON.parse(dataUrl);
    
    if (resultObj.imageDataUrl) {
      // It's our JSON format, download the image
      const link = document.createElement('a');
      link.href = resultObj.imageDataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Also create a hidden element with the metadata
      const metadataElement = document.createElement('div');
      metadataElement.style.display = 'none';
      metadataElement.setAttribute('data-tokenomics-backup', resultObj.metadata);
      document.body.appendChild(metadataElement);
      setTimeout(() => {
        if (metadataElement.parentNode) {
          metadataElement.parentNode.removeChild(metadataElement);
        }
      }, 1000);
      
      return;
    }
  } catch (error) {
    // Not JSON, use the original approach
    console.log("Not JSON format, using original download approach");
  }
  
  // Original approach for backward compatibility
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
