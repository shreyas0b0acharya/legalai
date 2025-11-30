import React, { useState, useMemo, useCallback } from "react";
import FileUploadZone from "./FileUploadZone";
import {
  FileText,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Shield,
  FolderOpen,
  Search,
  X,
} from "lucide-react";
import "./Dashboard.css";

export default function Dashboard({
  documents = [],
  onOpen,
  onFileSelect,
  onDelete,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Memoize risk counts to optimize performance
  const riskCounts = useMemo(() => {
    const counts = {
      all: documents.length,
      high: 0,
      low: 0,
      safe: 0,
      "not-analysed": 0,
    };
    documents.forEach((doc) => {
      if (doc.risk === "high") counts.high++;
      else if (doc.risk === "low") counts.low++;
      else if (doc.risk === "safe") counts.safe++;
      else counts["not-analysed"]++;
    });
    return counts;
  }, [documents]);

  // Memoize filtered docs
  const filteredDocs = useMemo(() => {
    let filtered = documents;
    if (filter !== "all") {
      filtered = filtered.filter((d) => d.risk === filter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) => d.originalName.toLowerCase().includes(query) ||
               (d.previewText && d.previewText.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [documents, filter, searchQuery]);

  const toggleFilter = useCallback((value) => {
    setFilter((prev) => (prev === value ? "all" : value));
    // Clear selection when changing filter
    if (selectedFiles.length > 0) setSelectedFiles([]);
  }, [selectedFiles.length]);

  const handleSelectAll = useCallback(() => {
    if (selectedFiles.length === filteredDocs.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredDocs.map((d) => d.id));
    }
  }, [selectedFiles.length, filteredDocs]);

  const handleDeleteSelected = useCallback(async () => {
    for (const id of selectedFiles) {
      const file = documents.find((d) => d.id === id);
      if (file) await onDelete(file);
    }
    setSelectedFiles([]);
    setDeleteTarget(null);
  }, [selectedFiles, documents, onDelete]);

  const handleDeleteSingle = useCallback(async (doc) => {
    await onDelete(doc);
    setDeleteTarget(null);
  }, [onDelete]);

  const handleOpenDoc = useCallback((doc) => {
    onOpen(doc);
    // Clear selection when opening a doc
    setSelectedFiles([]);
  }, [onOpen]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  return (
    <div className="dashboard-container theme-section" role="main" aria-label="Dashboard">
      {/* INLINE FILE UPLOAD */}
      <div className="inline-upload-wrapper">
        <FileUploadZone
          onFileSelect={onFileSelect}
          aria-label="Upload new document"
        />
      </div>

      {/* Search Bar - NEW: For better UX */}
      <div className="search-wrapper">
        <div className="search-input-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search documents by name or preview..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search documents"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="clear-search-btn" aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" role="navigation" aria-label="Filter by risk level">
        {[
          { key: "all", label: "Total Documents", icon: FolderOpen, color: "blue", count: riskCounts.all },
          { key: "high", label: "High Risk", icon: AlertTriangle, color: "red", count: riskCounts.high },
          { key: "low", label: "Low Risk", icon: Shield, color: "yellow", count: riskCounts.low },
          { key: "safe", label: "Safe", icon: ShieldCheck, color: "green", count: riskCounts.safe },
          { key: "not-analysed", label: "Not Analysed", icon: Shield, color: "gray", count: riskCounts["not-analysed"] },
        ].map(({ key, label, icon: Icon, color, count }) => (
          <div
            key={key}
            className={`stat-card glass ${filter === key ? "active-filter" : ""}`}
            onClick={() => toggleFilter(key)}
            onKeyDown={(e) => e.key === "Enter" && toggleFilter(key)}
            tabIndex={0}
            role="button"
            aria-label={`Filter by ${label}: ${count} documents`}
            aria-pressed={filter === key}
            style={{ cursor: "pointer" }}
          >
            <div className={`stat-icon ${color}`}>
              <Icon size={28} />
            </div>
            <p className="stat-label">{label}</p>
            <h2 className="stat-value">{count}</h2>
          </div>
        ))}
      </div>

      <h2 className="documents-title" id="documents-heading">
        {filter === "all"
          ? "Your Documents"
          : filter === "high"
          ? "High Risk Documents"
          : filter === "low"
          ? "Low Risk Documents"
          : filter === "safe"
          ? "Safe Documents"
          : "Not Analysed Documents"}
        {searchQuery && ` - Search results for "${searchQuery}"`}
      </h2>

      {selectedFiles.length > 0 && (
        <div className="multi-delete-bar" role="toolbar" aria-label="Selection controls">
          <button
            onClick={handleSelectAll}
            className="multi-btn"
            aria-label={selectedFiles.length === filteredDocs.length ? "Unselect all" : "Select all"}
          >
            {selectedFiles.length === filteredDocs.length ? "Unselect All" : "Select All"}
          </button>
          <button
            className="multi-delete-btn"
            onClick={() => setDeleteTarget("MULTI")}
            aria-label={`Delete ${selectedFiles.length} selected documents`}
          >
            Delete Selected ({selectedFiles.length})
          </button>
        </div>
      )}

      {/* Document Grid */}
      <div className="card-grid" role="list" aria-labelledby="documents-heading">
        {filteredDocs.length === 0 ? (
          <div className="empty-state glass" role="img" aria-label="No documents found">
            <FileText size={48} className="empty-icon" />
            <h3>No documents match your filter</h3>
            <p>Try adjusting your search or filter above.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className={`document-card glass card-hover ${selectedFiles.includes(doc.id) ? "selected" : ""}`}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleOpenDoc(doc)}
            >
              <div className="card-top">
                <div className="doc-icon">
                  <FileText size={26} />
                </div>
                <div className="card-right">
                  {doc.risk === "high" && <span className="badge badge-red">High Risk</span>}
                  {doc.risk === "low" && <span className="badge badge-yellow">Low Risk</span>}
                  {doc.risk === "safe" && <span className="badge badge-green">Safe</span>}
                  {(!doc.risk || doc.risk === "not-analysed") && <span className="badge badge-gray">Not Analysed</span>}
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(doc);
                    }}
                    aria-label={`Delete ${doc.originalName}`}
                  >
                    <Trash2 size={18} />
                  </button>
                  <input
                    type="checkbox"
                    className="doc-checkbox"
                    checked={selectedFiles.includes(doc.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSelectedFiles((prev) =>
                        e.target.checked
                          ? [...prev, doc.id]
                          : prev.filter((id) => id !== doc.id)
                      );
                    }}
                    aria-label={`Select ${doc.originalName}`}
                  />
                </div>
              </div>
              <div className="doc-body" onClick={() => handleOpenDoc(doc)}>
                <p className="doc-name" title={doc.originalName}>{doc.originalName}</p>
                <p className="doc-date">
                  {doc.createdAt
                    ?.toDate()
                    .toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                </p>
                <p className="doc-preview" title={doc.previewText || "Click to view analysis…"}>
                  {doc.previewText || "Click to view analysis…"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div
          className="delete-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="delete-modal">
            <AlertTriangle size={40} className="delete-warning-icon" aria-hidden="true" />
            {deleteTarget === "MULTI" ? (
              <>
                <h3 id="delete-modal-title">Delete {selectedFiles.length} Documents?</h3>
                <p>This action cannot be undone. Are you sure?</p>
              </>
            ) : (
              <>
                <h3 id="delete-modal-title">Delete Document?</h3>
                <p>
                  Are you sure you want to permanently delete{" "}
                  <strong>{deleteTarget.originalName}</strong>?
                </p>
              </>
            )}
            <div className="delete-modal-actions">
              <button
                className="modal-btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="modal-btn-danger"
                onClick={deleteTarget === "MULTI" ? handleDeleteSelected : () => handleDeleteSingle(deleteTarget)}
              >
                <Trash2 size={16} aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}