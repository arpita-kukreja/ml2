const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using Gemini 2.5 Flash - latest and fastest
const MODEL = 'gemini-2.5-flash';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Validates that a parsed quiz item has all required fields.
 */
const isValidQuestion = (item) =>
  typeof item.question === 'string' &&
  Array.isArray(item.options) &&
  item.options.length === 4 &&
  typeof item.correctIndex === 'number' &&
  item.correctIndex >= 0 &&
  item.correctIndex <= 3 &&
  typeof item.explanation === 'string' &&
  typeof item.topic === 'string';

/**
 * Calls Gemini and returns the raw text response.
 */
const callGemini = async (prompt, expectJson = false) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL,
      generationConfig: expectJson ? { responseMimeType: "application/json" } : {}
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error('[callGemini Error]', err.message);
    throw new Error(`Gemini API Error: ${err.message}`);
  }
};

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Generates a multiple-choice quiz from study notes.
 *
 * @param {string} notesText   Extracted PDF text (max 8000 chars)
 * @param {number} count       Number of questions to generate (default 10)
 * @returns {Promise<Array>}   Array of validated quiz question objects
 */
const generateQuiz = async (notesText, count = 10) => {
  // Truncate notes if too long
  const truncatedNotes = notesText.slice(0, 8000);
  
  const prompt = `You are an expert quiz creator. Generate exactly ${count} multiple choice questions from the study notes below. 

IMPORTANT: Return ONLY a valid JSON array with no markdown formatting, no code blocks, no extra text.

Each question object must have:
- question: string (the question text)
- options: array of exactly 4 strings (format: "A) answer", "B) answer", "C) answer", "D) answer")
- correctIndex: number (0 for A, 1 for B, 2 for C, 3 for D)
- explanation: string (one sentence explaining the answer)
- topic: string (max 3 words describing the concept)

Study Notes:
${truncatedNotes}

Return the JSON array now:`;

  const tryParse = async (attemptNum) => {
    console.log(`[generateQuiz] Attempt ${attemptNum}...`);
    const raw = await callGemini(prompt, true);
    console.log('[generateQuiz] Raw response length:', raw.length);
    
    // Clean up response - remove markdown code blocks if present
    let cleanedRaw = raw.trim();
    if (cleanedRaw.startsWith('```json')) {
      cleanedRaw = cleanedRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedRaw.startsWith('```')) {
      cleanedRaw = cleanedRaw.replace(/```\n?/g, '');
    }
    cleanedRaw = cleanedRaw.trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanedRaw);
    } catch (e) {
      console.error('[generateQuiz] JSON parse error:', e.message);
      console.error('[generateQuiz] Raw response:', cleanedRaw.substring(0, 500));
      throw new Error('Failed to parse JSON response from Gemini');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not a JSON array');
    }

    const valid = parsed.filter(isValidQuestion);
    console.log(`[generateQuiz] Valid questions: ${valid.length}/${parsed.length}`);
    
    if (valid.length === 0) {
      throw new Error('No valid questions in response');
    }

    return valid;
  };

  // Try up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await tryParse(attempt);
    } catch (err) {
      console.warn(`[generateQuiz] Attempt ${attempt} failed:`, err.message);
      if (attempt === 3) {
        throw new Error(`Quiz generation failed after 3 attempts: ${err.message}`);
      }
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

/**
 * Answers a student question using the uploaded notes as context.
 *
 * @param {string} userQuestion  The student's question
 * @param {string} notesText     The extracted PDF text
 * @returns {Promise<string>}    Concise answer (max 3 sentences)
 */
const answerQuestion = async (userQuestion, notesText) => {
  try {
    // Truncate notes if too long
    const truncatedNotes = notesText.slice(0, 8000);
    
    const prompt = `You are a helpful AI tutor. Answer the following question using ONLY the study notes provided below. 

Rules:
- Be concise (maximum 3 sentences)
- Use simple, clear language
- If the answer is not in the notes, say "This topic is not covered in the uploaded notes."
- Base your answer strictly on the provided notes

Question: ${userQuestion}

Study Notes:
${truncatedNotes}

Answer:`;

    const raw = await callGemini(prompt, false);
    return raw.trim();
  } catch (err) {
    console.error('[answerQuestion Error]', err.message);
    return "I'm having trouble connecting to my AI core right now. Please try again in a moment.";
  }
};

module.exports = { generateQuiz, answerQuestion };
