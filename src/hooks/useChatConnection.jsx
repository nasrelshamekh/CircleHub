import { createContext, useContext } from "react";

export const chatConnectionContext = createContext(null);

export function useChatConnection() {
    const context = useContext(chatConnectionContext);

    if (!context) {
        throw new Error(
            "useChatConnection must be used within a ChatConnectionProvider"
        );
    }

    return context;
}
