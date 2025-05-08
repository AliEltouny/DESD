// Next.js API route to handle community updates
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { formidable } from 'formidable';
import * as fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll use formidable
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests (Next.js API routes can't directly support PUT)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get slug from query
    const { slug } = req.query;
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Community slug is required' });
    }

    console.log(`[API Route] Processing update for community: ${slug}`);
    
    // Extract authentication token from cookies or headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try to extract from cookie header if not in Authorization header
      const cookies = req.headers.cookie || '';
      const tokenMatch = cookies.match(/accessToken=([^;]+)/);
      
      if (!tokenMatch) {
        return res.status(401).json({ 
          message: 'Authentication token is missing',
          status: 'error',
          code: 401
        });
      }
    }

    // Parse form data
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Create a new FormData for the backend request
    const formData = new FormData();

    // Add all fields
    Object.entries(fields).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => formData.append(key, v || ''));
      } else {
        formData.append(key, value || '');
      }
    });

    // Add files
    await Promise.all(
      Object.entries(files).map(async ([key, fileObj]) => {
        const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
        
        if (file && file.filepath) {
          try {
            const fileContent = await fs.promises.readFile(file.filepath);
            const blob = new Blob([fileContent], { type: file.mimetype || 'application/octet-stream' });
            formData.append(key, blob, file.originalFilename || 'file');
            
            // Clean up temp file
            await fs.promises.unlink(file.filepath).catch(console.error);
          } catch (error) {
            console.error(`Error processing file ${key}:`, error);
          }
        }
      })
    );

    // Forward the request to the Django backend
    try {
      console.log(`[API Route] Forwarding to Django backend for slug: ${slug}`);
      
      // Extract auth token
      let token = '';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        const cookies = req.headers.cookie || '';
        const tokenMatch = cookies.match(/accessToken=([^;]+)/);
        if (tokenMatch) {
          token = tokenMatch[1];
        }
      }
      
      // Set up request headers
      const headers: Record<string, string> = {
        // Let axios set the Content-Type for multipart
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[API Route] Including authorization token in request');
      } else {
        console.log('[API Route] Warning: No authorization token found');
      }
      
      const response = await axios.put(
        `http://localhost:8000/api/communities/${slug}/`, 
        formData,
        {
          headers,
          withCredentials: true,
        }
      );
      
      console.log(`[API Route] Backend response status: ${response.status}`);
      return res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('[API Route] Error from backend:', error.message);
      
      if (error.response) {
        // Return the actual error from the API
        return res.status(error.response.status).json(error.response.data);
      }
      
      return res.status(500).json({ 
        message: 'Error communicating with backend server',
        error: error.message
      });
    }
  } catch (error: any) {
    console.error('[API Route] Server error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
} 