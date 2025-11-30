// src/hooks/useChatLogic.ts 
import { useState, useRef, useEffect, useCallback } from "react";
import { handleCopyMarkdown } from "../src/utils/markdownCopy";
import { Message } from "../src/types/types";

const BASE_URL = "http://127.0.0.1:8000";

interface ChatLogicReturn {
  theme: "light" | "dark";
  toggleTheme: () => void;
  fileName: string | null;
  messages: Message[];
  question: string;
  setQuestion: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  uploading: boolean;
  file: File | null;
  showNewChatModal: boolean;
  setShowNewChatModal: React.Dispatch<React.SetStateAction<boolean>>;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isStreaming: boolean;
  editingIndex: number | null;
  setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>;
  editingText: string;
  setEditingText: React.Dispatch<React.SetStateAction<string>>;
  toastMessage: string | null;
  userScrolledUp: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  stopStreamingRef: React.MutableRefObject<boolean>;
  handleFileSelect: (file: File | null) => void;
  handleNewChat: () => void;
  handleUpload: (file: File) => Promise<void>;
  handleSaveEdit: (idx: number) => Promise<void>;
  handleRegenerate: (idx: number) => Promise<void>;
  handleCopy: (html: string, isAiMessage?: boolean) => Promise<void>;
  handleAsk: () => Promise<void>;
}

const useChatLogic = (): ChatLogicReturn => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("legalai-theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("legalai-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const [fileName, setFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  const stopStreamingRef = useRef<boolean>(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !menuButtonRef.current?.contains(e.target as Node)
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

    const handleScroll = (): void => {
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
    const el = document.querySelector(".chat-input") as HTMLTextAreaElement;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [question]);

  const showToast = useCallback((msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  }, []);

  const handleCopy = useCallback(async (html: string, isAiMessage = false): Promise<void> => {
    try {
      await handleCopyMarkdown(html, isAiMessage);
      showToast("Copied MD!");
    } catch (e) {
      console.log(e);
      showToast("Copied MD!");
    }
  }, [showToast]);

  const typeWriterEffect = useCallback((fullText: string, onUpdate: (partial: string) => void, onDone?: () => void): void => {
    let index = 0;
    stopStreamingRef.current = false;

    const tick = (): void => {
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
  }, []);

  const handleNewChat = useCallback((): void => {
    setMessages([]);
    setFileName(null);
    setQuestion("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleUpload = useCallback(async (fileToUpload: File): Promise<void> => {
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

      const fileNameStr = fileToUpload.name.replace(/\.pdf$/i, "").trim();
      await fetch(`${BASE_URL}/extract_text?filename=${fileNameStr}`, {
        method: "POST",
      });

      setFileName(fileNameStr);

      const introRes = await fetch(`${BASE_URL}/ai_answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          index_name: fileNameStr,
          question: "__FIRST_MESSAGE_SUMMARY__",
          top_k: 3,
        }),
      });

      const introData = await introRes.json();
      const introAnswer = introData.answer || "Document processed.";

      setMessages((prev) => [...prev, { sender: "ai" as const, text: introAnswer }]);

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai" as const,
          text: "❌ Failed to process document. Please try again.",
        },
      ]);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleAskEdited = useCallback(async (questionText: string, idx: number): Promise<void> => {
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

      let aiIndex: number;

      setMessages((prev) => {
        aiIndex = prev.length;
        return [...prev, { sender: "ai" as const, text: "" }];
      });

      setIsStreaming(true);
      setUserScrolledUp(false);

      typeWriterEffect(
        answer,
        (partial: string) =>
          setMessages((prev) => {
            const updated = [...prev];
            updated[aiIndex] = { sender: "ai" as const, text: partial };
            return updated;
          }),
        () => setIsStreaming(false)
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fileName, typeWriterEffect]);

  const handleFileSelect = useCallback((selectedFile: File | null): void => {
    if (fileName && messages.length > 0) {
      setShowNewChatModal(true);
    } else {
      setFile(selectedFile);
      if (selectedFile) {
        handleUpload(selectedFile);
      }
    }
  }, [fileName, messages.length, handleUpload]);

  const handleSaveEdit = useCallback(async (idx: number): Promise<void> => {
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
  }, [editingText, handleAskEdited]);

  const handleRegenerate = useCallback(async (idx: number): Promise<void> => {
    const prevUserMsg = messages[idx - 1];

    if (!prevUserMsg || prevUserMsg.sender !== "user") return;

    const questionText = prevUserMsg.text;

    setMessages((prev) => prev.slice(0, idx));

    await handleAskEdited(questionText, idx);
  }, [messages, handleAskEdited]);

  const handleAsk = useCallback(async (): Promise<void> => {
    if (!question.trim()) return;

    const userMessage = question;
    setMessages((prev) => [...prev, { sender: "user" as const, text: userMessage }]);
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

      let aiIndex: number | null = null;

      setMessages((prev) => {
        aiIndex = prev.length;
        return [...prev, { sender: "ai" as const, text: "" }];
      });

      if (aiIndex !== null) {
        setIsStreaming(true);
        setUserScrolledUp(false);

        typeWriterEffect(
          answer,
          (partial: string) => {
            setMessages((prev) => {
              const updated = [...prev];
              updated[aiIndex!] = { sender: "ai" as const, text: partial };
              return updated;
            });
          },
          () => {
            setIsStreaming(false);
          }
        );
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai" as const,
          text: "❌ Failed to fetch answer. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [question, fileName, typeWriterEffect]);

  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      const li = target.closest(".suggested-questions li");
      if (li) {
        const q = li.getAttribute("data-q") || (li as HTMLElement).textContent || "";
        setQuestion(q.trim());
        handleAsk();
      }
    };

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, [handleAsk]);

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
};

export default useChatLogic;