// src/lib/authService.js
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  db,
  ref,
  set,
  get,
  update
} from './firebase';

/**
 * Update user display name in both Auth and Database
 */
export async function updateUserProfile(displayName) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Update Firebase Auth Profile
    await updateProfile(user, { displayName });

    // Update Database Leaderboard/User node
    await update(ref(db, `leaderboard/${user.uid}`), { playerName: displayName });
    
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Change user password
 */
export async function changePassword(newPassword) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    // Might fail due to recent login requirement
    if (error.code === 'auth/requires-recent-login') {
      return { success: false, error: 'Please logout and login again to change password' };
    }
    return { success: false, error: error.message };
  }
}

// Save user to database helper
async function saveUserToDatabase(user) {
  if (!user) return;
  
  try {
    const userRef = ref(db, `leaderboard/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      await set(ref(db, `leaderboard/${user.uid}`), {
        playerId: user.uid,
        playerName: user.displayName || user.email.split('@')[0],
        email: user.email,
        createdAt: Date.now(),
        wins: 0,
        losses: 0,
        draws: 0,
        totalGames: 0,
        winStreak: 0,
        bestWinStreak: 0,
        elo: 1200,
        coins: 0,
        achievements: []
      });
      console.log('✅ User saved to leaderboard');
    }
  } catch (dbError) {
    console.warn('Could not save to DB:', dbError);
  }
}

// Register new user
export async function registerUser(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await saveUserToDatabase(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email already in use';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters';
    }
    return { success: false, error: errorMessage };
  }
}

// Login user
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = error.message;
    if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    }
    return { success: false, error: errorMessage };
  }
}

// Reset password
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: error.message };
  }
}

// Logout
export async function logoutUser() {
  try {
    await signOut(auth);
    sessionStorage.clear();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// Listen to auth state changes
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user?.email || 'No user');
    callback(user);
  });
}

// Get player stats
export async function getPlayerStats(userId) {
  try {
    const userRef = ref(db, `leaderboard/${userId}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting player stats:', error);
    return null;
  }
}