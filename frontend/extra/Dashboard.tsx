// src/components/Dashboard.tsx
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  updateDoc,
  DocumentData,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { api } from "../src/lib/api";
import axios from "axios";

interface DashboardProps {
  currentView: "dashboard" | "chat";
  setCurrentView: (v: "dashboard" | "chat") => void;
  setCurrentDoc: (doc: any) => void;
  currentDoc: any;
}

interface FirestoreDoc extends DocumentData {
  id: string;
  userId: string;
  original_name: string;
  saved_filename: string;
  uploadDate: any;
  riskCount: number;
  riskLevel: string;
  chatHistory: any[];
  description: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  currentView,
  setCurrentView,
  setCurrentDoc,
  currentDoc,
}) => {
  const [documents, setDocuments] = useState<FirestoreDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);

  // ------------ FETCH DOCUMENTS ------------
  useEffect(() => {
    if (currentView !== "dashboard") return;
    fetchDocuments();
  }, [currentView]);

  const fetchDocuments = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "documents"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("uploadDate", "desc")
      );

      const snapshot = await getDocs(q);

      const docs: FirestoreDoc[] = snapshot.docs.map((snap) => ({
        id: snap.id,
        ...(snap.data() as DocumentData),
      })) as FirestoreDoc[];

      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // ------------ HANDLE UPLOAD ------------
  const handleUploadNew = async (file: File | null) => {
    if (!file) return;

    setUploading(true);

    try {
      // 1) Upload file to backend
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await api.post("/upload", formData);

      // 2) Firestore initial document
      const newDocData: Omit<FirestoreDoc, "id"> = {
        userId: auth.currentUser?.uid!,
        original_name: uploadResponse.data.original_name,
        saved_filename: uploadResponse.data.saved_filename,
        uploadDate: new Date(),
        riskCount: 0,
        riskLevel: "medium",
        chatHistory: [],
        description: `This ${uploadResponse.data.original_name} is a service agreement...`,
      };

      const docRef = await addDoc(collection(db, "documents"), newDocData);

      // 3) Risk analysis (mock or backend)
      const analysis = { riskCount: 4, riskLevel: "high" };

      await updateDoc(docRef, analysis);

      // Refresh list
      fetchDocuments();

      // Auto-open chat for newly uploaded doc
      const fullDoc: any = {
        id: docRef.id,
        ...newDocData,
        ...analysis,
      };

      setCurrentDoc(fullDoc);
      setCurrentView("chat");
    } catch (error) {
      console.error("Upload failed:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          message: error.message,
          code: error.code, // e.g., 'ERR_NETWORK', 'ECONNABORTED'
          status: error.response?.status, // HTTP status code (if response received)
          data: error.response?.data, // Response data from the server
          headers: error.response?.headers, // Response headers
          request: error.request // The request that was made
        });
      }
    } finally {
      setUploading(false);
    }
  };

  // ------------ SELECT DOCUMENT ------------
  const handleSelectDocument = (doc: FirestoreDoc) => {
    setCurrentDoc(doc);
    setCurrentView("chat");
  };

  // ------------ STATS ------------
  const stats = {
    total: documents.length,
    highRisk: documents.filter((d) => d.riskLevel === "high").length,
    analyzed: documents.length,
    lowRisk: documents.filter((d) => d.riskLevel === "low").length,
  };

  // ------------ LOADING STATE ------------
  if (loading) {
    return <div className="dashboard-loading">Loading your documents...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <div className="dashboard-sidebar">
        <div className="navigation-section">
          <h3>NAVIGATION</h3>
          <ul>
            <li className={currentView === "dashboard" ? "active" : ""}>
              Dashboard
            </li>
          </ul>
        </div>

        <div className="features-section">
          <h3>FEATURES</h3>
          <ul>
            <li>
              <span className="feature-icon">📄</span>
              Extract & Analyze
              <br />
              <small>AI-powered document processing</small>
            </li>
            <li>
              <span className="feature-icon">⚠️</span>
              Risk Detection
              <br />
              <small>Identify problematic clauses</small>
            </li>
          </ul>
        </div>

        <div className="user-section">
          <h3>User</h3>
          <p>Legal Document Analyst</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="dashboard-main">
        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div>
              <strong>Total Documents</strong>
              <div>{stats.total}</div>
            </div>
          </div>
          <div className="stat-card high-risk">
            <div className="stat-icon">🚨</div>
            <div>
              <strong>High Risk Found</strong>
              <div>{stats.highRisk}</div>
            </div>
          </div>
          <div className="stat-card analyzed">
            <div className="stat-icon">✅</div>
            <div>
              <strong>Analyzed</strong>
              <div>{stats.analyzed}</div>
            </div>
          </div>
          <div className="stat-card low-risk">
            <div className="stat-icon">🛡️</div>
            <div>
              <strong>Low Risk</strong>
              <div>{stats.lowRisk}</div>
            </div>
          </div>
        </div>

        {/* DOCUMENTS LIST */}
        <div className="documents-section">
          <div className="section-header">
            <h2>Your Documents</h2>
            <label className="upload-btn" htmlFor="file-upload">
              <input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={(e) => handleUploadNew(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload New
            </label>
          </div>

          {uploading && (
            <div className="uploading-indicator">Processing document...</div>
          )}

          {documents.length === 0 ? (
            <div className="empty-state">
              <p>No documents yet. Upload your first legal document to begin.</p>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`document-card ${
                    doc.riskLevel === "high" ? "high-risk" : ""
                  }`}
                  onClick={() => handleSelectDocument(doc)}
                >
                  <div className="doc-header">
                    <div className="doc-icon">📄</div>
                    <div className="doc-meta">
                      <h4>{doc.original_name}</h4>
                      <p>
                        {doc.uploadDate?.toDate
                          ? doc.uploadDate.toDate().toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </div>

                  <p className="doc-description">{doc.description}</p>

                  <div className="doc-footer">
                    <span className="risk-count">
                      {doc.riskCount} risks identified
                    </span>
                    <div className={`risk-badge ${doc.riskLevel}`}>
                      {doc.riskLevel} risk
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
