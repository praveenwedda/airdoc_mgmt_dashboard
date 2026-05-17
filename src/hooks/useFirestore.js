import { useState, useEffect } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'

// Hook for fetching a single document
export function useDocument(collectionName, docId) {
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!docId) {
      setLoading(false)
      return
    }

    const docRef = doc(db, collectionName, docId)
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setDocument({ id: snapshot.id, ...snapshot.data() })
        } else {
          setDocument(null)
        }
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [collectionName, docId])

  return { document, loading, error }
}

// Hook for fetching a collection
export function useCollection(collectionName, queryConstraints = []) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const collectionRef = collection(db, collectionName)
    const q = queryConstraints.length > 0
      ? query(collectionRef, ...queryConstraints)
      : collectionRef

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        setDocuments(docs)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [collectionName, JSON.stringify(queryConstraints)])

  return { documents, loading, error }
}

// Hook for Firestore operations
export function useFirestoreOperations() {
  const { currentUser } = useAuth()

  const addDocument = async (collectionName, data) => {
    const collectionRef = collection(db, collectionName)
    return addDoc(collectionRef, {
      ...data,
      createdBy: currentUser?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }

  const updateDocument = async (collectionName, docId, data) => {
    const docRef = doc(db, collectionName, docId)
    return updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  }

  const deleteDocument = async (collectionName, docId) => {
    const docRef = doc(db, collectionName, docId)
    return deleteDoc(docRef)
  }

  const getDocument = async (collectionName, docId) => {
    const docRef = doc(db, collectionName, docId)
    const snapshot = await getDoc(docRef)
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() }
    }
    return null
  }

  const getCollection = async (collectionName, queryConstraints = []) => {
    const collectionRef = collection(db, collectionName)
    const q = queryConstraints.length > 0
      ? query(collectionRef, ...queryConstraints)
      : collectionRef
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  return {
    addDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    getCollection
  }
}

// Re-export Firestore query helpers
export { where, orderBy, query }
