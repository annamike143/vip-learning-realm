// --- Error Logging API Endpoint ---
import { db } from '@/app/lib/firebase';
import { ref, push, serverTimestamp } from 'firebase/database';

export async function POST(request) {
  try {
    const errorData = await request.json();

    // Validate error data
    if (!errorData.type || !errorData.message) {
      return Response.json(
        { error: 'Missing required fields: type, message' },
        { status: 400 }
      );
    }

    // Prepare error entry
    const errorEntry = {
      ...errorData,
      serverTimestamp: serverTimestamp(),
      environment: process.env.NODE_ENV,
      platform: 'learning-realm',
      resolved: false
    };

    // Store in Firebase
    const errorsRef = ref(db, 'errors');
    await push(errorsRef, errorEntry);

    // Log critical errors immediately
    if (errorData.severity === 'CRITICAL') {
      console.error('CRITICAL ERROR:', errorData);
      
      // Could send notification to admin here
      // await notifyAdmin(errorEntry);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error logging API error:', error);
    
    return Response.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
