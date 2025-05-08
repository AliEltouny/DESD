import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { formidable } from 'formidable';
import fs from 'fs';
import { API_URL } from '@/services/api/apiClient';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get slug from query params
    const slug = req.query.slug as string;
    if (!slug) {
      return res.status(400).json({ message: 'Slug is required' });
    }

    console.log(`[community-proxy] Processing update request for community: ${slug}`);

    // Parse form data with formidable
    const form = formidable({
      keepExtensions: true,
      multiples: true,
    });

    // Parse the form
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    console.log(`[community-proxy] Form parsed with ${Object.keys(files).length} files and ${Object.keys(fields).length} fields`);

    // Create form data for axios
    const formData = new FormData();

    // Process fields
    Object.entries(fields).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => formData.append(key, v));
      } else if (value) {
        formData.append(key, value.toString());
      }
    });

    // Process files
    await Promise.all(
      Object.entries(files).map(async ([key, fileObj]) => {
        const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
        
        if (file && file.filepath) {
          try {
            const content = await fs.promises.readFile(file.filepath);
            const blob = new Blob([content], { type: file.mimetype || 'application/octet-stream' });
            formData.append(key, blob, file.originalFilename || 'file');
            
            // Clean up temporary file
            await fs.promises.unlink(file.filepath).catch(e => 
              console.warn(`[community-proxy] Failed to delete temp file: ${e.message}`)
            );
          } catch (error) {
            console.error(`[community-proxy] Error processing file ${key}:`, error);
            throw error;
          }
        }
      })
    );

    console.log(`[community-proxy] Sending request to backend: ${API_URL}/api/communities/${slug}/`);

    // Send request to backend
    const response = await axios.put(
      `${API_URL}/api/communities/${slug}/`,
      formData,
      {
        headers: {
          // Content-Type will be set automatically with boundary
          'Cookie': req.headers.cookie || '',
          'Authorization': req.headers.authorization || '',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    console.log(`[community-proxy] Backend responded with status: ${response.status}`);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('[community-proxy] Error:', error);
    
    const statusCode = error.response?.status || 500;
    const errorData = {
      message: error.message || 'An error occurred while updating the community',
      details: error.response?.data || null,
      status: statusCode
    };
    
    return res.status(statusCode).json(errorData);
  }
} 