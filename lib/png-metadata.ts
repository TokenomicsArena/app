/**
 * Embeds JSON data into a PNG image as metadata
 * @param imageData The original PNG image as an ArrayBuffer
 * @param jsonData The JSON object to embed as metadata
 * @returns A new ArrayBuffer containing the PNG with embedded metadata
 */
export function embedJSONintoPNG(imageData: ArrayBuffer, jsonData: any): ArrayBuffer {
  // Convert the PNG to Uint8Array for manipulation
  const uint8Array = new Uint8Array(imageData);
  
  // Prepare the JSON data
  const jsonString = JSON.stringify(jsonData);
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonString);
  
  // Create a chunk with type 'tEXt' - PNG metadata text chunk
  // Format: keyword + null separator + text
  const keyword = 'jsonData';
  const keywordBytes = encoder.encode(keyword);
  const nullSeparator = new Uint8Array([0]); // null byte separator
  
  // Chunk structure: Length (4 bytes) + Type (4 bytes) + Data + CRC (4 bytes)
  const chunkType = encoder.encode('tEXt');
  const chunkData = new Uint8Array([...keywordBytes, ...nullSeparator, ...jsonBytes]);
  const chunkLength = new Uint8Array(4);
  
  // Set chunk length (big-endian)
  const dataLength = chunkData.length;
  chunkLength[0] = (dataLength >> 24) & 0xff;
  chunkLength[1] = (dataLength >> 16) & 0xff;
  chunkLength[2] = (dataLength >> 8) & 0xff;
  chunkLength[3] = dataLength & 0xff;
  
  // Calculate CRC (Cyclic Redundancy Check)
  const crc = calculateCRC32([...chunkType, ...chunkData]);
  
  // Create the full chunk
  const chunk = new Uint8Array([
    ...chunkLength,
    ...chunkType,
    ...chunkData,
    ...crc
  ]);
  
  // Find where to insert the new chunk (after IHDR chunk, which is always the first chunk after the PNG signature)
  // PNG signature is 8 bytes, then IHDR chunk
  const ihdrLength = (uint8Array[8] << 24) | (uint8Array[9] << 16) | (uint8Array[10] << 8) | uint8Array[11];
  const insertPosition = 8 + 4 + 4 + ihdrLength + 4; // Signature + Length + Type + IHDR data + CRC
  
  // Create a new PNG with the embedded metadata
  const result = new Uint8Array(uint8Array.length + chunk.length);
  result.set(uint8Array.slice(0, insertPosition), 0);
  result.set(chunk, insertPosition);
  result.set(uint8Array.slice(insertPosition), insertPosition + chunk.length);
  
  return result.buffer;
}

/**
 * Extracts JSON data from a PNG image's metadata
 * @param imageData The PNG image as an ArrayBuffer
 * @returns The extracted JSON object, or null if no JSON data is found
 */
export function extractJSONfromPNG(imageData: ArrayBuffer): any | null {
  const uint8Array = new Uint8Array(imageData);
  const decoder = new TextDecoder();
  
  // Skip PNG signature (8 bytes)
  let offset = 8;
  
  // Iterate through chunks
  while (offset < uint8Array.length) {
    // Read chunk length and type
    const length = (uint8Array[offset] << 24) | (uint8Array[offset + 1] << 16) | 
                  (uint8Array[offset + 2] << 8) | uint8Array[offset + 3];
    offset += 4;
    
    const chunkType = decoder.decode(uint8Array.slice(offset, offset + 4));
    offset += 4;
    
    // Check if this is a text chunk
    if (chunkType === 'tEXt') {
      const chunkData = uint8Array.slice(offset, offset + length);
      
      // Find the null separator
      let separatorIndex = 0;
      while (separatorIndex < chunkData.length && chunkData[separatorIndex] !== 0) {
        separatorIndex++;
      }
      
      // Extract keyword and text
      const keyword = decoder.decode(chunkData.slice(0, separatorIndex));
      
      // Check if this is our JSON data
      if (keyword === 'jsonData') {
        const jsonText = decoder.decode(chunkData.slice(separatorIndex + 1));
        try {
          return JSON.parse(jsonText);
        } catch (e) {
          console.error('Failed to parse JSON data from PNG:', e);
          return null;
        }
      }
    }
    
    // Skip chunk data and CRC
    offset += length + 4;
  }
  
  return null;
}

/**
 * Calculate CRC32 checksum for PNG chunk
 * @param data Uint8Array data to calculate CRC for
 * @returns Uint8Array with 4 bytes CRC
 */
function calculateCRC32(data: number[]): Uint8Array {
  // CRC32 polynomial used by PNG
  const polynomial = 0xEDB88320;
  let crc = 0xFFFFFFFF;
  
  // Calculate CRC
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? polynomial : 0);
    }
  }
  
  // Invert the result
  crc = ~crc >>> 0;
  
  // Convert to 4 bytes (big-endian)
  const result = new Uint8Array(4);
  result[0] = (crc >> 24) & 0xFF;
  result[1] = (crc >> 16) & 0xFF;
  result[2] = (crc >> 8) & 0xFF;
  result[3] = crc & 0xFF;
  
  return result;
}
