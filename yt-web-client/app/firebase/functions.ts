import {getAuth} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

export async function uploadVideo(file: File) {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
        throw new Error('User must be authenticated');
    }

    // Get the ID token for authentication
    const token = await user.getIdToken();

    // Call the HTTP function
    const response = await fetch('https://us-central1-yt-clone-f4daa.cloudfunctions.net/generateUploadUrl', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            fileExtension: file.name.split('.').pop(),
            originalFileName: file.name
        })
    });

    if (!response.ok) {
        throw new Error('Failed to get upload URL');
    }

    const data = await response.json();

    // Upload the file via the signed URL
    await fetch(data.url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-type': file.type
        }
    });
    return;
}

const getVideosFunction = httpsCallable(functions, 'getVideos');

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: 'processing' | 'processed',
  title?: string,
  description?: string  
}

export async function getVideos() {
  const response = await getVideosFunction() as { data: Video[] };
  return response.data;
}
