export type MessageType = "text" | "photo";

export interface Message {
    id: string;
    uid?: string;
    nickname?: string;
    text?: string;
    photoURL?: string;
    type: MessageType;
    isUnlocked?: boolean;
    status?: "pending" | "approved";
    createdAt?: number; // ms
    pixelSize?: number;
}
