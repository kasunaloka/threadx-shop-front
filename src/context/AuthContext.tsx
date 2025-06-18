import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  updateEmail: (email: string, password: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  function signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  async function updateProfile(displayName: string) {
    if (!currentUser) throw new Error('No user logged in');
    return firebaseUpdateProfile(currentUser, { displayName });
  }

  async function updateEmail(email: string, password: string) {
    if (!currentUser) throw new Error('No user logged in');
    if (!currentUser.email) throw new Error('Current user has no email');
    
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
    return firebaseUpdateEmail(currentUser, email);
  }

  async function updatePassword(currentPassword: string, newPassword: string) {
    if (!currentUser) throw new Error('No user logged in');
    if (!currentUser.email) throw new Error('Current user has no email');
    
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    return firebaseUpdatePassword(currentUser, newPassword);
  }

  async function deleteAccount(password: string) {
    if (!currentUser) throw new Error('No user logged in');
    if (!currentUser.email) throw new Error('Current user has no email');
    
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
    return firebaseDeleteUser(currentUser);
  }

  function logout() {
    return signOut(auth);
  }

  async function getIdToken() {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    updateProfile,
    updateEmail,
    updatePassword,
    deleteAccount,
    logout,
    getIdToken
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      signUp: async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
      },
      signIn: async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signInWithGoogle: async () => {
        await signInWithPopup(auth, new GoogleAuthProvider());
      },
      resetPassword: async (email: string) => {
        await sendPasswordResetEmail(auth, email);
      },
      updateProfile: async (displayName: string) => {
        if (!currentUser) throw new Error('No user logged in');
        await firebaseUpdateProfile(currentUser, { displayName });
      },
      updateEmail: async (email: string, password: string) => {
        if (!currentUser) throw new Error('No user logged in');
        if (!currentUser.email) throw new Error('Current user has no email');
        
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        await firebaseUpdateEmail(currentUser, email);
      },
      updatePassword: async (currentPassword: string, newPassword: string) => {
        if (!currentUser) throw new Error('No user logged in');
        if (!currentUser.email) throw new Error('Current user has no email');
        
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await firebaseUpdatePassword(currentUser, newPassword);
      },
      deleteAccount: async (password: string) => {
        if (!currentUser) throw new Error('No user logged in');
        if (!currentUser.email) throw new Error('Current user has no email');
        
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        await firebaseDeleteUser(currentUser);
      },
      logout,
      getIdToken
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );}
