import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const userDoc = await getDoc(doc(db, 'users', result.user.uid))
    if (userDoc.exists()) {
      const data = userDoc.data()
      if (data.active === false) {
        await signOut(auth)
        throw new Error('Account has been deactivated')
      }
      setUserRole(data.role)
      setUserData(data)
    }
    return result
  }

  async function logout() {
    setUserRole(null)
    setUserData(null)
    return signOut(auth)
  }

  async function createUser(email, password, name, role) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', result.user.uid), {
      name,
      email,
      role,
      active: true,
      createdAt: serverTimestamp()
    })
    return result
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setUserRole(data.role)
            setUserData(data)
          } else {
            setUserRole(null)
            setUserData(null)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUserRole(null)
          setUserData(null)
        }
      } else {
        setUserRole(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userRole,
    userData,
    loading,
    login,
    logout,
    createUser,
    isAdmin: userRole === 'admin',
    isManager: userRole === 'manager' || userRole === 'admin',
    isViewer: userRole === 'viewer'
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
