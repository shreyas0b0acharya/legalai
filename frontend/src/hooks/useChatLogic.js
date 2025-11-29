import { useState, useRef, useEffect } from "react";
import { handleCopyMarkdown } from "../utils/markdownCopy";

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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const chatContainerRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const stopStreamingRef = useRef(false);

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

  const handleFileSelect = (selectedFile) => {
    if (fileName && messages.length > 0) {
      setShowNewChatModal(true);
    } else {
      setFile(selectedFile);
      handleUpload(selectedFile);
    }
    if (file) {
      console.log(file);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setFileName(null);
    setQuestion("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (fileToUpload) => {
    if (!fileToUpload) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const uploadRes = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      console.log(uploadData);

      const fileName = fileToUpload.name.replace(/\.pdf$/i, "").trim();
      await fetch(`${BASE_URL}/extract_text?filename=${fileName}`, {
        method: "POST",
      });

      setFileName(fileName);

      await fetch(`${BASE_URL}/extract_text?filename=${fileName}`, {
        method: "POST",
      });

      setFileName(fileName);

      const introRes = await fetch(`${BASE_URL}/ai_answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index_name: fileName,
          question: "__FIRST_MESSAGE_SUMMARY__",
          top_k: 3,
        }),
      });

      const introData = await introRes.json();
      const introAnswer = introData.answer || "Document processed.";

      setMessages((prev) => [...prev, { sender: "ai", text: introAnswer }]);

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "❌ Failed to process document. Please try again.",
        },
      ]);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async (idx) => {
    const newMessageText = editingText.trim();
    if (!newMessageText) return;

    setMessages((prev) => {
      const updated = [...prev];
      updated[idx].text = newMessageText;
      return updated;
    });

    setMessages((prev) => prev.slice(0, idx + 1));

    setEditingIndex(null);
    setEditingText("");

    await handleAskEdited(newMessageText, idx);
  };

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
        (partial) =>
          setMessages((prev) => {
            const updated = [...prev];
            updated[aiIndex] = { sender: "ai", text: partial };
            return updated;
          }),
        () => setIsStreaming(false)
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRegenerate = async (idx) => {
    const prevUserMsg = messages[idx - 1];

    if (!prevUserMsg || prevUserMsg.sender !== "user") return;

    const questionText = prevUserMsg.text;

    setMessages((prev) => prev.slice(0, idx));

    await handleAskEdited(questionText);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopy = async (html, isAiMessage = false) => {
    try {
      await handleCopyMarkdown(html, isAiMessage);
      showToast("Copied MD!");
    } catch (e) {
      console.log(e);
      showToast("Copied MD!");
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userMessage = question;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setQuestion("");
    setLoading(true);
    setIsStreaming(false);

    try {
      const res = await fetch(`${BASE_URL}/ai_answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index_name: fileName,
          question: userMessage,
          top_k: 3,
        }),
      });

      const data = await res.json();
      const answer = data.answer || "No answer received.";

      let aiIndex = null;

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
          setIsStreaming(false);
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
  };
}

export default useChatLogic;