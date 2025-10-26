import { supabase } from './supabase';

/**
 * Get email from username using PostgreSQL function
 * @param username - The username to lookup
 * @returns The email associated with the username, or null if not found
 */
export async function getEmailFromUsername(username: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_email_from_username', {
      username_input: username,
    });

    if (error) {
      console.error('Error getting email from username:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting email from username:', error);
    return null;
  }
}

/**
 * Sign in with username or email
 * @param usernameOrEmail - The username or email
 * @param password - The password
 * @returns Authentication result
 */
export async function signInWithUsernameOrEmail(
  usernameOrEmail: string,
  password: string
) {
  // Check if input is an email (contains @)
  const isEmail = usernameOrEmail.includes('@');

  let email = usernameOrEmail;

  // If it's not an email, try to get the email from username
  if (!isEmail) {
    const emailFromUsername = await getEmailFromUsername(usernameOrEmail);

    if (!emailFromUsername) {
      return {
        data: { user: null, session: null },
        error: { message: 'Nom d\'utilisateur introuvable', name: 'AuthError', status: 400 },
      };
    }

    email = emailFromUsername;
  }

  // Sign in with email
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Check if username is available
 * @param username - The username to check
 * @returns true if available, false if taken
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    // Username is available if no data is returned
    return !data;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}
