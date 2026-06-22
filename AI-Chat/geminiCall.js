import { GoogleGenerativeAI } from '@google/generative-ai';

import news from '../tempNewsData.js';
import newsPrompt from './prompt.js';

import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getNewsJson(transcriptText) {
  try {
    console.log('running gemini 3');

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction:
        'You are an automated OSINT data extractor. Always return strict, valid JSON.',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const prompt = `
      ${newsPrompt}
      TRANSCRIPT:
      ${transcriptText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const extractedData = JSON.parse(response.text());

    // console.log(extractedData);

    console.log('extraction complete');
    return extractedData;
  } catch (error) {
    console.error(
      'Extraction failed, throwing back to BullMQ for retry:',
      error
    );
    throw error;
  }
}

// const json = await runExtractionJob(news);

/*test -----------*/

// async function getNewsJson(t) {
//   console.log('under the jsonNews');
//   return [
//     {
//       headline: 'thisis dumb',
//       category: 'noen',
//       impact_scope: 'none',
//     },
//   ];
// }

export default getNewsJson;

// console.log(json);

// console.log(json[0].entities.people);
// console.log(json[0].entities.organisation);
