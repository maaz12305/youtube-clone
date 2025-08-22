'use client';

import { Fragment } from "react";
import { signInWithGoogle, signOut } from "../firebase/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import styles from './sign-in.module.css';
import { User } from "firebase/auth";


interface SignInProps {
    user: User | null;
}

export default function SignIn({ user }: SignInProps) {
    const handleSignIn = async () => {
        try {
            const result = await signInWithGoogle();
            // Call the createUser function after successful sign in
            const functions = getFunctions();
            const createUser = httpsCallable(functions, 'createUser');
            await createUser();
            console.log('User created in database');
        } catch (error) {
            console.error('Error during sign in:', error);
        }
    };

    return (
        <Fragment>
            { user ? 
                (
                    <button className={styles.signin} onClick={signOut}>
                        Sign Out
                    </button>
                ) : (
                    <button className={styles.signin} onClick={handleSignIn}>
                        Sign In
                    </button>
                )
            }
        </Fragment>
    )
}