import { useState, useCallback, useEffect } from 'react';
import { HistoryItem } from '../types';

const HISTORY_KEY = 'vocabularyHistory';

// Function to load history from storage
const loadHistory = (): HistoryItem[] => {
    try {
        const item = window.localStorage.getItem(HISTORY_KEY);
        if (!item) return [];
        
        const parsed = JSON.parse(item);

        // Migration logic for backward compatibility
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            const migratedHistory: HistoryItem[] = parsed.map((content: string) => ({
                name: content.substring(0, 30) + (content.length > 30 ? '...' : ''), // Use truncated content as name for old data
                content: content,
            }));
            // Immediately save migrated data back
            window.localStorage.setItem(HISTORY_KEY, JSON.stringify(migratedHistory));
            return migratedHistory;
        }
        
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Failed to load history:", error);
        return [];
    }
};

export const useHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

    // Effect to save history to localStorage whenever it changes
    useEffect(() => {
        try {
            window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }, [history]);

    const addHistoryItem = useCallback((newItem: HistoryItem) => {
        const trimmedContent = newItem.content.trim();
        if (!trimmedContent) return;

        setHistory(prevHistory => {
            const isExisting = prevHistory.some(item => item.content === trimmedContent);
            if (isExisting) {
                return prevHistory; // Do not add if it already exists
            }
            // Add new item to the beginning
            return [newItem, ...prevHistory].slice(0, 50);
        });
    }, []);

    const deleteHistoryItem = useCallback((index: number) => {
        setHistory(prevHistory => prevHistory.filter((_, i) => i !== index));
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    return { history, addHistoryItem, deleteHistoryItem, clearHistory };
};
