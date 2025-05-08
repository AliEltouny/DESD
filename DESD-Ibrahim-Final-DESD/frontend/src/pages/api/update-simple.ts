import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import formidable from 'formidable';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug is required' });
  }
  
  try {
    // Parse multipart form data
    const form = new formidable.IncomingForm();
    
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });
    
    // Create a new FormData to send to backend
    const formData = new FormData();
    
    // Add text fields
    Object.entries(fields).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => formData.append(key, v));
      } else {
        formData.append(key, value);
      }
    });
    
    // Add files
    Object.entries(files).forEach(([key, fileObj]) => {
      const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
      if (file && file.filepath) {
        formData.append(key, createReadStream(file.filepath), {
          filename: file.originalFilename,
          contentType: file.mimetype
        });
      }
    });
    
    // Forward to backend
    const response = await axios.put(
      `http://localhost:8000/api/communities/${slug}/`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Cookie': req.headers.cookie || '',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error updating community:', error);
    
    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data || { error: 'Backend error' });
    }
    
    return res.status(500).json({ error: 'Failed to update community', details: error.message });
  }
} 