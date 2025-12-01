// api/imagen.js для Vercel
export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { prompt, model = 'imagen-3.0-generate-001' } = req.body;
    
    if (!prompt || !prompt.text) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Ваш Google Cloud API Key
    const API_KEY = process.env.GOOGLE_API_KEY;
    const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
    
    if (!API_KEY || !PROJECT_ID) {
      return res.status(500).json({ error: 'Google API configuration missing' });
    }

    // Определяем endpoint для модели
    let endpoint;
    let apiVersion = 'v1';
    
    switch(model) {
      case 'imagen-4.0-ultra-generate-001':
        endpoint = `https://us-central1-aiplatform.googleapis.com/${apiVersion}/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-4.0-ultra-generate-001:predict`;
        break;
      case 'imagen-4.0-generate-001':
        endpoint = `https://us-central1-aiplatform.googleapis.com/${apiVersion}/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-4.0-generate-001:predict`;
        break;
      case 'imagen-4.0-fast-generate-001':
        endpoint = `https://us-central1-aiplatform.googleapis.com/${apiVersion}/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-4.0-fast-generate-001:predict`;
        break;
      case 'imagen-3.0-generate-001':
      default:
        endpoint = `https://us-central1-aiplatform.googleapis.com/${apiVersion}/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;
    }

    // Формируем запрос для Google AI Platform
    const requestBody = {
      instances: [
        {
          prompt: prompt.text
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1'
      }
    };

    // Добавляем негативный промпт если есть
    if (prompt.negativePrompt && prompt.negativePrompt.text) {
      requestBody.parameters.negativePrompt = prompt.negativePrompt.text;
    }

    // Добавляем настройки безопасности если указаны
    if (req.body.imageGenerationConfig && req.body.imageGenerationConfig.safetySettings) {
      requestBody.parameters.safetySettings = req.body.imageGenerationConfig.safetySettings;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google AI Error:', data);
      return res.status(response.status).json(data);
    }

    // Форматируем ответ для клиента
    const formattedResponse = {
      images: data.predictions?.map(prediction => ({
        bytesBase64Encoded: prediction.bytesBase64Encoded,
        mimeType: prediction.mimeType || 'image/png'
      })) || []
    };

    res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('Imagen Proxy Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
