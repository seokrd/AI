// api/imagen.js - Vercel Serverless Function
// Разместите этот файл в папке api/ вашего Vercel проекта

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Получаем API ключ из переменных окружения Vercel
    const API_KEY = process.env.GOOGLE_AI_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ 
        error: { message: 'API key not configured in Vercel environment variables' } 
      });
    }

    // Извлекаем модель из тела запроса или используем дефолтную
    const { model = 'imagen-3.0-generate-001', ...requestBody } = req.body;

    // Формируем URL для Imagen API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${model}:predict`;

    console.log('Proxying request to:', apiUrl);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    // Отправляем запрос к Google Imagen API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': AIzaSyDUhWwlluIJLjN7yWV4uhQETwgE0ITpp1A
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Imagen API error:', data);
      return res.status(response.status).json(data);
    }

    console.log('Imagen API success');
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: { 
        message: error.message || 'Internal server error',
        details: error.toString()
      } 
    });
  }
}
