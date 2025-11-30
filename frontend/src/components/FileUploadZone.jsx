import React, { useRef, useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import "./FileUploadZone.css";

export default React.memo(function FileUploadZone({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const resetInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
      setError("");
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf" && file.size <= 10 * 1024 * 1024) {
      onFileSelect(file);
      resetInput();
    } else {
      setError(
        file?.type !== "application/pdf"
          ? "Please upload a PDF file only."
          : "File size exceeds 10MB limit."
      );
    }
  }, [onFileSelect, resetInput]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf" && file.size <= 10 * 1024 * 1024) {
      onFileSelect(file);
    } else {
      setError(
        file?.type !== "application/pdf"
          ? "Please upload a PDF file only."
          : file ? "File size exceeds 10MB limit." : ""
      );
    }
    resetInput();
  }, [onFileSelect, resetInput]);

  const handleZoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleButtonClick = useCallback((e) => {
    e.stopPropagation();
    handleZoneClick();
  }, [handleZoneClick]);

  const clearError = useCallback(() => setError(""), []);

  return (
    <div
      className={`upload-zone ${dragActive ? "drag-active" : ""} ${error ? "error" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleZoneClick}
      role="button"
      tabIndex={0}
      aria-label="Upload PDF file"
      aria-describedby={error ? "upload-error" : undefined}
      onKeyDown={(e) => e.key === "Enter" && handleZoneClick()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="hidden-input"
        aria-hidden="true"
      />

      <div className="upload-icon-box">
        <FileText className="upload-icon" aria-hidden="true" />
      </div>

      <h3 className="upload-title">Upload Legal Document</h3>

      <p className="upload-subtitle">
        Drag & drop your PDF here, or click to browse.
      </p>

      <button
        className="upload-btn"
        onClick={handleButtonClick}
        aria-label="Choose file"
      >
        <Upload className="btn-icon" aria-hidden="true" />
        Choose File
      </button>

      <p className="upload-hint" aria-hidden="true">PDF only • Max 10MB</p>

      {error && (
        <div className="error-message" id="upload-error" role="alert">
          <span className="error-icon">
            <X size={16} aria-hidden="true" />
          </span>
          {error}
          <button
            className="clear-error-btn"
            onClick={clearError}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
});