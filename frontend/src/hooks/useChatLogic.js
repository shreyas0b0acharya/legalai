import { useState, useRef, useEffect } from "react";
import { handleCopyMarkdown } from "../utils/markdownCopy";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const BASE_URL = "http://127.0.0.1:8000";

function useChatLogic() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("legalai-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("legalai-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  

  // 🆕 Added for message storage
  const currentFileIdRef = useRef(null);

  const [fileName, setFileName] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(true);
  const [displayFileName, setDisplayFileName] = useState(null);
  const [displayFileId, setDisplayFileId] = useState(null); // <-- new




  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const chatContainerRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const stopStreamingRef = useRef(false);

  // 📌 Load all files
  useEffect(() => {
  const user = getAuth().currentUser;
  if (!user) return;

  setFilesLoading(true);

  const q = query(
    collection(db, "users", user.uid, "files"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    setFiles(snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })));

    setFilesLoading(false);  // ✔ correct placement
  });
}, []);


useEffect(() => {
  // if no file id -> not loading
  if (!displayFileId) {
    setMessageLoading(false);
    setMessages([]); // optional: clear messages when no file selected
    return;
  }

  setMessageLoading(true);

  const user = getAuth().currentUser;
  if (!user) {
    setMessageLoading(false);
    return;
  }

  const msgRef = collection(
    db,
    "users",
    user.uid,
    "files",
    displayFileId,
    "messages"
  );
  const q = query(msgRef, orderBy("createdAt", "asc"));

  const unsub = onSnapshot(q, (snapshot) => {
    const loaded = snapshot.docs.map((doc) => doc.data());
    setMessages(loaded);
    setMessageLoading(false);
  });

  return () => unsub();
}, [displayFileId]);

  function extractRisk(html) {
    const match = html.match(/risk-(high|low|safe)/i);
    return match ? match[1].toLowerCase() : "not-analysed";
  }

function extractPreviewText(text) {
  if (!text) return "Preview unavailable";

  // Remove markdown & HTML
  let cleaned = text.replace(/<\/?[^>]+(>|$)/g, "");

  // Find "summary" keyword (case-insensitive)
  const parts = cleaned.split(/summary[:\-]*/i);

  // If "summary" exists, take everything after it
  cleaned = parts.length > 1 ? parts[1].trim() : cleaned.trim();

  // Take first 2 lines only
  const lines = cleaned.split("\n").filter((l) => l.trim() !== "");
  const firstTwo = lines.slice(0, 2).join(" ");

  return firstTwo.slice(0, 160); // limit length if needed
}




  // ✨ Save message to Firestore
  const saveMessage = async (msg) => {
    const user = getAuth().currentUser;
    if (!user) return;

    const fileId = currentFileIdRef.current;
    if (!fileId) return;

    const msgRef = collection(
      db,
      "users",
      user.uid,
      "files",
      fileId,
      "messages"
    );

    await addDoc(msgRef, {
      sender: msg.sender,
      text: msg.text,
      createdAt: serverTimestamp(),
    });
  };

  // Menu click outside handler
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !menuButtonRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

   useEffect(() => {
    userScrolledUpRef.current = userScrolledUp;
  }, [userScrolledUp]);

  // Scroll handler
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;

      setUserScrolledUp(!isAtBottom);
      userScrolledUpRef.current = !isAtBottom;
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const el = document.querySelector(".chat-input");
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [question]);

  // Suggested Q click
  useEffect(() => {
    const handleClick = (e) => {
      const li = e.target.closest(".suggested-questions li");
      if (li) {
        const q = li.getAttribute("data-q") || li.innerText;
        setQuestion(q);
        handleAsk(q);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // File select handler
const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    handleUpload(selectedFile);
};


  // Start new chat
  const handleNewChat = () => {
    setMessages([]);
    setFileName(null);
    setDisplayFileName(null);
    setDisplayFileId(null);   // <-- clear active id too
    setQuestion("");

    currentFileIdRef.current = null;

    if (fileInputRef.current) fileInputRef.current.value = "";
  };



  // 📁 Upload PDF & create Firestore file record
// --- inside useChatLogic (frontend) ---

// 📁 Upload PDF & create Firestore file record
const handleUpload = async (fileToUpload) => {
  if (!fileToUpload) return;
    setDisplayFileId(null);
    setDisplayFileName(null);

  try {
    setUploading(true);

    const formData = new FormData();
    formData.append("file", fileToUpload);

    // 1) Upload PDF
    const uploadRes = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();
    const { original_name, saved_filename, path } = uploadData;

    // 2) Extract + index build
    const extractRes = await fetch(
      `${BASE_URL}/extract_text?filename=${encodeURIComponent(saved_filename)}`,
      { method: "POST" }
    );
    const extractData = await extractRes.json();
    const backendIndexName =
      extractData.index_name || saved_filename.replace(/\.pdf$/i, "");

    setFileName(backendIndexName);

    // 3) FIRST AI message
    const introRes = await fetch(`${BASE_URL}/ai_answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index_name: backendIndexName,
        question: "__FIRST_MESSAGE_SUMMARY__",
        top_k: 3,
      }),
    });

    const introData = await introRes.json();
    const introAnswer = introData.answer || "Unable to process these type of documents.";
    const risk = extractRisk(introAnswer);

    const aiMsg = { sender: "ai", text: introAnswer };

    // ⛔ DON'T save yet — fileId doesn't exist
    setMessages([aiMsg]);

    // 4) CREATE Firestore file FIRST
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const previewText = extractPreviewText(introAnswer);

    const userFilesRef = collection(db, "users", user.uid, "files");
    const docRef = await addDoc(userFilesRef, {
      originalName: original_name,
      savedName: saved_filename,
      backendPath: path,
      risk,
      previewText,
      indexName: backendIndexName,
      createdAt: serverTimestamp(),
    });

    // 🔥 NOW fileId exists
    currentFileIdRef.current = docRef.id;
    setDisplayFileId(docRef.id);           // <-- new
    setDisplayFileName(original_name);     // <-- ensure name also set

    // 5) SAVE first AI message NOW (correct order!)
    await saveMessage(aiMsg);

    // cleanup UI
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

  } catch (err) {
    console.error("handleUpload error:", err);
  } finally {
    setUploading(false);
  }
};



// 📂 Load file from DB (use savedName / indexName)
const handleFileSelectFromDB = async (fileData) => {
  currentFileIdRef.current = fileData.id;

  // Set REAL original file name for sidebar
  setDisplayFileName(fileData.originalName);
  setDisplayFileId(fileData.id); // <-- new

  // Keep indexName for backend
  const indexName = fileData.indexName || (fileData.savedName || "").replace(/\.pdf$/i, "");
  setFileName(indexName);
};



const handleDelete = async (fileData) => {
  try {
    const user = getAuth().currentUser;
    if (!user) return;

    const fileId = fileData.id;
    const fileRef = doc(db, "users", user.uid, "files", fileId);

    // 🔥 1) DELETE all messages under this file
    const msgRef = collection(db, "users", user.uid, "files", fileId, "messages");
    const q = query(msgRef);
    const snap = await getDocs(q);

    const deletes = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes); // important

    // 🔥 2) DELETE the backend uploaded file
    await fetch(`${BASE_URL}/delete_file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saved_filename: fileData.savedName,
        index_name: fileData.indexName,
      }),
    });

    // 🔥 3) DELETE the Firestore file document
    await deleteDoc(fileRef);

    // 🔥 4) Cleanup UI
    setFiles((prev) => prev.filter((f) => f.id !== fileId));

    if (currentFileIdRef.current === fileId) {
      currentFileIdRef.current = null;
      setMessages([]);
      setFileName(null);
    }

    setToastMessage("Document deleted");
    setTimeout(() => setToastMessage(null), 2000);

  } catch (err) {
    console.error("Delete Error:", err);
    setToastMessage("Failed to delete");
  }
};


  // Save edited message
  // Save edited message + delete following messages + append new AI messages
const handleSaveEdit = async (idx) => {
  const newText = editingText.trim();
  if (!newText) return;

  const user = getAuth().currentUser;
  if (!user) return;

  const fileId = currentFileIdRef.current;
  if (!fileId) return;

  const msgRef = collection(
    db,
    "users",
    user.uid,
    "files",
    fileId,
    "messages"
  );

  // 1️⃣ Load message docs with their IDs
  const q = query(msgRef, orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  const docs = snap.docs;

  const targetDoc = docs[idx];
  if (!targetDoc) return;

  // 2️⃣ Update the edited message
  await updateDoc(targetDoc.ref, {
    text: newText,
    updatedAt: serverTimestamp(),
  });

  // 3️⃣ Delete all messages AFTER the edited one
  const docsToDelete = docs.slice(idx + 1);
  for (const d of docsToDelete) {
    await deleteDoc(d.ref);
  }

  // 4️⃣ Update UI instantly
  setMessages((prev) => prev.slice(0, idx + 1).map((m, i) =>
    i === idx ? { ...m, text: newText } : m
  ));

  // 5️⃣ Clear edit state
  setEditingIndex(null);
  setEditingText("");

  // 6️⃣ Generate new AI response for the edited message
  await handleAskEdited(newText);
};


  // Ask edited question
  const handleAskEdited = async (questionText) => {
    setLoading(true);
    setIsStreaming(false);

    try {
      const res = await fetch(`${BASE_URL}/ai_answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index_name: fileName,
          question: questionText,
          top_k: 3,
        }),
      });

      const data = await res.json();
      const answer = data.answer || "No answer received.";

      let aiIndex;

      setMessages((prev) => {
        aiIndex = prev.length;
        return [...prev, { sender: "ai", text: "" }];
      });
       setIsStreaming(true);
      setUserScrolledUp(false);

      typeWriterEffect(
        answer,
        (partial) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[aiIndex] = { sender: "ai", text: partial };
            return updated;
          });
        },
        () => {
           () => setIsStreaming(false)

          saveMessage({ sender: "ai", text: answer });
        }
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Streaming typewriter effect
  const typeWriterEffect = (fullText, onUpdate, onDone) => {
    let index = 0;
    stopStreamingRef.current = false;

    const tick = () => {
      if (stopStreamingRef.current) {
        setIsStreaming(false);
        onDone?.();
        return;
      }

      if (index <= fullText.length) {
        onUpdate(fullText.slice(0, index));
        index++;

        if (!userScrolledUpRef.current) {
          requestAnimationFrame(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
            }
          });
        }

        setTimeout(tick, 8);
      } else {
         setIsStreaming(false);
        onDone?.();
      }
    };
      setIsStreaming(true);
    userScrolledUpRef.current = false;

    tick();
  };

  // Regenerate response
  // Regenerate AI response: delete old AI reply + write new one
const handleRegenerate = async (aiIdx) => {
  const user = getAuth().currentUser;
  if (!user) return;

  const fileId = currentFileIdRef.current;
  if (!fileId) return;

  const prevUserMsg = messages[aiIdx - 1];
  const prevAiMsg = messages[aiIdx];

  if (!prevUserMsg || prevUserMsg.sender !== "user") return;
  if (!prevAiMsg || prevAiMsg.sender !== "ai") return;

  const msgRef = collection(
    db,
    "users",
    user.uid,
    "files",
    fileId,
    "messages"
  );

  // Load all messages (to get doc IDs)
  const q = query(msgRef, orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  const docs = snap.docs;

  const aiDoc = docs[aiIdx];
  if (!aiDoc) return;

  // 🧨 Delete the old AI reply from Firestore
  await deleteDoc(aiDoc.ref);

  // 🔥 Remove from UI
  setMessages((prev) => {
    const updated = [...prev];
    updated.splice(aiIdx, 1);
    return updated;
  });

  // 🆕 Now generate a fresh AI response
  await handleAskEdited(prevUserMsg.text);
};

  // Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopy = async (html, isAiMessage = false) => {
    try {
      await handleCopyMarkdown(html, isAiMessage);
      showToast("Copied!");
    } catch (e) {
      showToast("e");
      console.log(e);
      
    }
  };


  // MAIN ASK FUNCTION — SAVES USER & AI MESSAGES
  const handleAsk = async () => {
    if (!question.trim()) return;

    const userMessageObj = { sender: "user", text: question };
    setMessages((prev) => [...prev, userMessageObj]);
    saveMessage(userMessageObj);

    setQuestion("");
    setLoading(true);
    setIsStreaming(false);

    try {
      const res = await fetch(`${BASE_URL}/ai_answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index_name: fileName,
          question: userMessageObj.text,
          top_k: 3,
        }),
      });

      const data = await res.json();
      const answer = data.answer || "No answer received.";

      let aiIndex;

      setMessages((prev) => {
        aiIndex = prev.length;
        return [...prev, { sender: "ai", text: "" }];
      });
       setIsStreaming(true);
      setUserScrolledUp(false);

      typeWriterEffect(
        answer,
        (partial) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[aiIndex] = { sender: "ai", text: partial };
            return updated;
          });
        },
        () => {
          saveMessage({ sender: "ai", text: answer });
        }
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "❌ Failed to fetch answer. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    theme,
    toggleTheme,
    fileName,
    messages,
    question,
    setQuestion,
    loading,
    uploading,
    file,
    showNewChatModal,
    setShowNewChatModal,
    menuOpen,
    setMenuOpen,
    isStreaming,
    editingIndex,
    setEditingIndex,
    editingText,
    setEditingText,
    toastMessage,
    userScrolledUp,
    messagesEndRef,
    fileInputRef,
    menuRef,
    menuButtonRef,
    chatContainerRef,
    stopStreamingRef,
    handleFileSelect,
    handleNewChat,
    handleUpload,
    handleSaveEdit,
    handleRegenerate,
    handleCopy,
    handleAsk,
    handleFileSelectFromDB,
    files,
    handleDelete,
    messageLoading,
    filesLoading,
    displayFileName,
    setDisplayFileName,
    displayFileId,
    setDisplayFileId,
    currentFileIdRef,
    setFileName,
    setMessages
  };
}

export default useChatLogic;
