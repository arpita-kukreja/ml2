const fs = require('fs');
const pdf = require('pdf-parse');

const MAX_CHARS = 8000;

/**
 * Extracts plain text from a PDF file at the given path.
 * Trims the result to MAX_CHARS and deletes the temp file afterwards.
 *
 * @param {string} filePath  Absolute path to the temporary uploaded PDF
 * @returns {Promise<string>} Extracted and trimmed text
 */
const extractText = async (filePath) => {
  try {
    console.log('[extractText] Reading file:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF file not found at path: ' + filePath);
    }
    
    // Read file
    const dataBuffer = fs.readFileSync(filePath);
    console.log('[extractText] File size:', dataBuffer.length, 'bytes');
    
    // Parse PDF - pdf-parse is the default export
    const data = await pdf(dataBuffer);
    console.log('[extractText] Extracted text length:', data.text.length, 'characters');
    console.log('[extractText] Number of pages:', data.numpages);
    
    const text = data.text.trim();
    
    if (!text || text.length === 0) {
      throw new Error('No text could be extracted from the PDF. It may be a scanned image or empty.');
    }
    
    // Trim to max chars
    const trimmedText = text.slice(0, MAX_CHARS);
    console.log('[extractText] Returning text length:', trimmedText.length, 'characters');
    
    return trimmedText;
  } catch (err) {
    console.error('[extractText] Error:', err.message);
    throw err;
  } finally {
    // Always clean up temp file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('[extractText] Cleaned up temp file:', filePath);
      }
    } catch (cleanupErr) {
      console.warn('[extractText] Failed to cleanup file:', cleanupErr.message);
    }
  }
};

module.exports = { extractText };
