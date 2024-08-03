import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      console.error('API Key is missing from environment variables');
      return res.status(500).json({ error: 'API key is missing' });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch voices:', errorText);
      throw new Error('Failed to fetch voices');
    }

    const voices = await response.json();
    res.status(200).json(voices);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Erro na API:', error.message);
      res.status(500).json({ error: error.message });
    } else {
      console.error('Erro desconhecido:', error);
      res.status(500).json({ error: 'Erro desconhecido' });
    }
  }
}
