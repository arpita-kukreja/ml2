/**
 * Test script to verify Gemini API connection
 * Run with: node test-gemini.js
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL = 'gemini-2.5-flash';

async function testGeminiConnection() {
  console.log('🧪 Testing Gemini API Connection...\n');
  
  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }
  
  console.log('✅ API Key found');
  console.log('📝 Model:', MODEL);
  console.log('');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL });
    
    console.log('🔄 Sending test request...');
    const result = await model.generateContent('Say "Hello, BrainRoom!" in a friendly way.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API Connection Successful!\n');
    console.log('📨 Response:', text);
    console.log('');
    
    // Test JSON mode
    console.log('🔄 Testing JSON mode...');
    const jsonModel = genAI.getGenerativeModel({ 
      model: MODEL,
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const jsonResult = await jsonModel.generateContent(
      'Return a JSON object with fields: message (string), success (boolean), timestamp (number)'
    );
    const jsonResponse = await jsonResult.response;
    const jsonText = jsonResponse.text();
    
    console.log('✅ JSON Mode Working!\n');
    console.log('📨 JSON Response:', jsonText);
    
    const parsed = JSON.parse(jsonText);
    console.log('✅ JSON Parsed Successfully:', parsed);
    console.log('');
    
    // Test quiz generation
    console.log('🔄 Testing quiz generation...');
    const quizPrompt = `Generate exactly 2 multiple choice questions about JavaScript. Return ONLY a valid JSON array. Each element must have: question (string), options (array of 4 strings), correctIndex (number 0-3), explanation (string), topic (string).`;
    
    const quizResult = await jsonModel.generateContent(quizPrompt);
    const quizResponse = await quizResult.response;
    let quizText = quizResponse.text().trim();
    
    // Clean markdown if present
    if (quizText.startsWith('```json')) {
      quizText = quizText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const quiz = JSON.parse(quizText);
    console.log('✅ Quiz Generation Working!\n');
    console.log('📊 Generated Questions:', quiz.length);
    console.log('📝 Sample Question:', quiz[0].question);
    console.log('');
    
    console.log('🎉 All Tests Passed!');
    console.log('✅ Gemini API is ready to use');
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify your API key at https://aistudio.google.com/apikey');
    console.error('2. Check if the model name is correct:', MODEL);
    console.error('3. Ensure you have API quota remaining');
    console.error('4. Check your internet connection');
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

testGeminiConnection();
