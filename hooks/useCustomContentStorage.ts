import { useState, useCallback } from 'react';
import { CustomContent } from '../types';

const STORAGE_KEY = 'customVocabularyContent';

type AllCustomContent = Record<string, Record<string, CustomContent>>;

const loadFromStorage = (): AllCustomContent => {
    try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        return item ? JSON.parse(item) : {};
    } catch (error) {
        console.error("Failed to load custom content from storage", error);
        return {};
    }
};

const saveToStorage = (data: AllCustomContent) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save custom content to storage", error);
    }
};

export const useCustomContentStorage = () => {
    const [allContent, setAllContent] = useState<AllCustomContent>(loadFromStorage);

    const updateContentForVocab = useCallback((vocabKey: string, newContent: Record<string, CustomContent>) => {
        const trimmedKey = vocabKey.trim();
        if (!trimmedKey) return;
        setAllContent(prev => {
            const updated = { ...prev, [trimmedKey]: newContent };
            saveToStorage(updated);
            return updated;
        });
    }, []);

    const deleteContentForVocab = useCallback((vocabKey: string) => {
        const trimmedKey = vocabKey.trim();
        if (!trimmedKey) return;
        setAllContent(prev => {
            const updated = { ...prev };
            delete updated[trimmedKey];
            saveToStorage(updated);
            return updated;
        });
    }, []);
    
    const clearAllStoredContent = useCallback(() => {
        setAllContent({});
        try {
            window.localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error("Failed to clear custom content from storage", error);
        }
    }, []);

    return {
        allContent,
        updateContentForVocab,
        deleteContentForVocab,
        clearAllStoredContent
    };
};
