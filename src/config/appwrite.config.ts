import { Client, Storage, ID, Account } from 'appwrite';

// Initialize Appwrite Client
const client = new Client();

// Initialize Appwrite Account for authentication
const account = new Account(client);

// Initialize Appwrite Storage
const storage = new Storage(client);

client
    .setEndpoint(`https://${process.env.REACT_APP_APPWRITE_REGION}.cloud.appwrite.io/v1`)
    .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID || '');

// Create anonymous session if none exists
const createAnonymousSession = async () => {
  try {
    // Try to get current session
    await account.get();
    console.log('Existing session found');
    return true;
  } catch (error) {
    console.log('No existing session, creating anonymous session...');
    // If no session exists, create an anonymous session
    try {
      const session = await account.createAnonymousSession();
      console.log('Anonymous session created successfully:', session);
      return true;
    } catch (sessionError) {
      console.error('Failed to create anonymous session:', sessionError);
      return false;
    }
  }
};

// Initialize anonymous session immediately
(async () => {
  try {
    await createAnonymousSession();
  } catch (e) {
    console.error('Error during session initialization:', e);
  }
})();

// Export configured Appwrite client and services
export { client, storage, account, ID, createAnonymousSession };
