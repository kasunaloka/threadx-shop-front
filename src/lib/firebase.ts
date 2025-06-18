
// This file is temporarily disabled to prevent Firebase initialization errors
// The application uses WooCommerce authentication instead

export const auth = null;
export const db = null;

// Placeholder functions to prevent import errors
export const signInWithEmailAndPassword = () => Promise.reject('Firebase disabled');
export const createUserWithEmailAndPassword = () => Promise.reject('Firebase disabled');
export const signOut = () => Promise.reject('Firebase disabled');
export const onAuthStateChanged = () => () => {};
