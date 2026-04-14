export interface ChatMessage{
     id: string;
     threadId: string;
     senderId : string;
     message: string;
     timestamp: Date;
}

export interface ChatThread{
    id: string;
    userId: string;
    subject: string
    isOpened: boolean;
    isAi: boolean;
    createdAt: Date;
}