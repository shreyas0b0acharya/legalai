// src/types.ts (New shared types file - add this for common types)
export interface Message {
  sender: "user" | "ai";
  text: string;
}