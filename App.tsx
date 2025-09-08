
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AppState, QuizType, IMAGE_STYLES } from './types';
import type { Quiz1Question, Quiz2Question, Quiz3Question, QuizQuestion, ImageStyle, LearningCard, CustomContent, HistoryItem } from './types';
import { generateDefinitionQuiz, generateSentenceQuiz, generateConceptQuiz, generateLearningCards, extractWordsFromText, parseStructuredVocabularyInput, generateVoiceMaterial, generateVoiceWordMaterial, generateVoiceWordMaterial2 } from './services/geminiService';
import { useTTS } from './hooks/useTTS';
import { useHistory } from './hooks/useHistory';
import { useCustomContentStorage } from './hooks/useCustomContentStorage';
import { 
    QuizScreen, 
    ResultsScreen, 
    SettingsModal, 
    Spinner, 
    SettingsIcon, 
    LearningScreen, 
    Worksheet, 
    LearningMaterialPrintView, 
    MaterialDisplayScreen, 
    HistoryModal,
    ImageManagerModal
} from './components/QuizComponents';

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V3.888c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);

const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.INPUT);
    const [vocabulary, setVocabulary] = useState<string>('如釋重負,得不償失,荒謬絕倫,心照不宣,忙碌');
    const [quiz1Data, setQuiz1Data] = useState<Quiz1Question[]>([]);
    const [quiz2Data, setQuiz2Data] = useState<Quiz2Question[]>([]);
    const [quiz3Data, setQuiz3Data] = useState<Quiz3Question[]>([]);
    const [learningData, setLearningData] = useState<LearningCard[]>([]);
    const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[]>([]);
    const [currentQuizType, setCurrentQuizType] = useState<QuizType | null>(null);
    const [printViewContent, setPrintViewContent] = useState<'single' | 'all'>('single');
    const [voiceMaterial, setVoiceMaterial] = useState<string>('');
    const [voiceWordMaterial, setVoiceWordMaterial] = useState<string>('');
    const [voiceWordMaterial2, setVoiceWordMaterial2] = useState<string>('');
    const [customContent, setCustomContent] = useState<Record<string, CustomContent>>({});
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { speak, voices, settings, setSettings } = useTTS();
    const { history, addHistoryItem, deleteHistoryItem, clearHistory } = useHistory();
    const { allContent, updateContentForVocab, deleteContentForVocab, clearAllStoredContent } = useCustomContentStorage();
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
    const [imageStyle, setImageStyle] = useState<ImageStyle>(IMAGE_STYLES[0]);
    
    const [isImageGenerationEnabled, setIsImageGenerationEnabled] = useState(true);

    const imageManagerWords = useMemo(() => {
        const wordsFromStorage = Object.keys(customContent);
        return wordsFromStorage;
    }, [customContent]);


    useEffect(() => {
        const key = vocabulary.trim();
        if (key) {
            setCustomContent(allContent[key] || {});
        } else {
            setCustomContent({});
        }
    }, [vocabulary, allContent]);


    const saveToHistoryWithPrompt = useCallback((content: string) => {
        const trimmedContent = content.trim();
        if (!trimmedContent) return;
    
        const defaultName = trimmedContent.substring(0, 20) + (trimmedContent.length > 20 ? '...' : '');
        const name = window.prompt('請為這筆輸入記錄命名：', defaultName);

        if (name !== null) { 
            addHistoryItem({ name: name || defaultName, content: trimmedContent });
        }
    }, [addHistoryItem]);

    const handleOpenImageManager = useCallback(() => {
        const trimmedVocabulary = vocabulary.trim();
        if (!trimmedVocabulary) {
            setError('請先輸入內容才能管理圖片。');
            return;
        }
        setError(null);
        setIsImageManagerOpen(true);
    }, [vocabulary]);


    const handleAnalyze = useCallback(async () => {
        const trimmedVocabulary = vocabulary.trim();
        if (!trimmedVocabulary) {
            setError(`請輸入內容以開始解析。`);
            return;
        }

        setError(null);
        setIsLoading(true);
        setLoadingMessage('正在分析您輸入的內容...');
        
        try {
            saveToHistoryWithPrompt(trimmedVocabulary);
            let parsedCards = await parseStructuredVocabularyInput(trimmedVocabulary);
            let finalWords: string[] = [];
            let finalCards: LearningCard[] = [];

            if (parsedCards && parsedCards.length > 0) {
                setLoadingMessage('偵測到結構化資料，正在為您準備教材...');
                finalWords = parsedCards.map(c => c.word);
                finalCards = parsedCards.map(card => {
                    const custom = customContent[card.word];
                    if (custom) {
                        const newCard = { ...card };
                        const sentences = [custom.sentence, ...newCard.sentences.filter(s => s !== custom.sentence)];
                        newCard.sentences = sentences.slice(0, 3);
                        return newCard;
                    }
                    return card;
                });
            } else {
                setLoadingMessage('正在分析文本並提取詞彙...');
                const extractedWords = await extractWordsFromText(trimmedVocabulary);

                if (extractedWords.length < 1) {
                    setError('無法從您輸入的內容中提取有效的詞彙，請嘗試提供更清晰的文本或直接輸入詞彙清單。');
                    setIsLoading(false);
                    return;
                }
                finalWords = extractedWords;

                setLoadingMessage('正在為您準備學習卡片...');
                finalCards = await generateLearningCards(finalWords, customContent);
            }
            
            setLearningData(finalCards);
            
            if (finalWords.length < 4) {
                setError(`產生測驗至少需要4個詞彙，但只偵測到 ${finalWords.length} 個。測驗功能將無法使用。`);
                setQuiz1Data([]);
                setQuiz2Data([]);
                setQuiz3Data([]);
            } else {
                setLoadingMessage('正在為您產生個人化的測驗...');
                const [defQuiz, sentQuiz, conceptQuiz] = await Promise.all([
                    generateDefinitionQuiz(finalWords, finalCards), 
                    generateSentenceQuiz(finalWords, finalCards), 
                    generateConceptQuiz(finalWords, finalCards),
                ]);

                const finalSentQuiz = sentQuiz.map(q => {
                    const custom = customContent[q.word];
                    if (custom) {
                        const card = finalCards.find(c => c.word === q.word);
                        const hint = card ? `(${card.definition})` : '';
                        return {
                            ...q,
                            sentence: `${custom.sentence.replace(q.word, '____')} ${hint}`.trim(),
                        };
                    }
                    return q;
                });

                setQuiz1Data(defQuiz);
                setQuiz2Data(finalSentQuiz);
                setQuiz3Data(conceptQuiz);
                
                if (defQuiz.length === 0 && finalSentQuiz.length === 0 && conceptQuiz.length === 0) {
                     setError('AI 無法為這些詞彙產生測驗題目。學習與圖片管理功能仍可使用。');
                }
            }

            setAppState(AppState.POST_ANALYSIS);

        } catch (err) {
            console.error(err);
            setError('處理您的請求時發生錯誤，請檢查您的網路連線，然後再試一次。');
        } finally {
            setIsLoading(false);
        }
    }, [vocabulary, saveToHistoryWithPrompt, customContent]);

    const handleCustomContentUpdate = (word: string, content: CustomContent) => {
        setCustomContent(prevContent => {
            const newContent = { ...prevContent, [word]: content };
            updateContentForVocab(vocabulary.trim(), newContent);
            return newContent;
        });
    };

    const handleCustomContentDelete = (word: string) => {
        setCustomContent(prevContent => {
            const newContent = { ...prevContent };
            delete newContent[word];
            updateContentForVocab(vocabulary.trim(), newContent);
            return newContent;
        });
    };

    const handleDeleteHistoryItemWithContent = (index: number) => {
        const itemToDelete = history[index];
        if (itemToDelete) {
            deleteContentForVocab(itemToDelete.content);
        }
        deleteHistoryItem(index);
    };

    const handleClearHistoryWithContent = () => {
        clearAllStoredContent();
        clearHistory();
    };


    const handleGenerateVoiceMaterial = useCallback(async () => {
        if (!vocabulary.trim()) {
            setError('請輸入生字以產生教材。');
            return;
        }

        setError(null);
        setIsLoading(true);
        setLoadingMessage('正在為您產生語音教材...');

        try {
            saveToHistoryWithPrompt(vocabulary);
            const result = await generateVoiceMaterial(vocabulary);
            setVoiceMaterial(result);
            setAppState(AppState.VOICE_MATERIAL);
        } catch (err) {
            console.error(err);
            setError('處理您的請求時發生錯誤，請檢查您的網路連線，然後再試一次。');
        } finally {
            setIsLoading(false);
        }
    }, [vocabulary, saveToHistoryWithPrompt]);

    const handleGenerateVoiceWordMaterial = useCallback(async () => {
        if (!vocabulary.trim()) {
            setError('請輸入語詞以產生教材。');
            return;
        }

        setError(null);
        setIsLoading(true);
        setLoadingMessage('正在為您產生語詞教材...');

        try {
            saveToHistoryWithPrompt(vocabulary);
            const result = await generateVoiceWordMaterial(vocabulary);
            setVoiceWordMaterial(result);
            setAppState(AppState.VOICE_WORD_MATERIAL);
        } catch (err) {
            console.error(err);
            setError('處理您的請求時發生錯誤，請檢查您的網路連線，然後再試一次。');
        } finally {
            setIsLoading(false);
        }
    }, [vocabulary, saveToHistoryWithPrompt]);

    const handleGenerateVoiceWordMaterial2 = useCallback(async () => {
        if (!vocabulary.trim()) {
            setError('請輸入語詞以產生教材。');
            return;
        }

        setError(null);
        setIsLoading(true);
        setLoadingMessage('正在為您產生語詞教材...');

        try {
            saveToHistoryWithPrompt(vocabulary);
            const result = await generateVoiceWordMaterial2(vocabulary);
            setVoiceWordMaterial2(result);
            setAppState(AppState.VOICE_WORD_MATERIAL_2);
        } catch (err) {
            console.error(err);
            setError('處理您的請求時發生錯誤，請檢查您的網路連線，然後再試一次。');
        } finally {
            setIsLoading(false);
        }
    }, [vocabulary, saveToHistoryWithPrompt]);

    const startQuiz = (type: QuizType) => {
        const blankUtterance = new SpeechSynthesisUtterance('');
        blankUtterance.volume = 0;
        window.speechSynthesis.speak(blankUtterance);
    
        let data: QuizQuestion[] = [];
        if (type === QuizType.DEFINITION) {
            data = quiz1Data;
        } else if (type === QuizType.SENTENCE) {
            data = quiz2Data;
        } else if (type === QuizType.CONCEPT) {
            data = quiz3Data;
        }

        setCurrentQuiz(shuffleArray(data));
        setCurrentQuizType(type);
        setAppState(AppState.QUIZ);
    };

    const handleQuizComplete = (incorrectQuestions: QuizQuestion[]) => {
        setCurrentQuiz(incorrectQuestions);
        setAppState(AppState.RESULTS);
    };
    
    const handleExportWorksheet = () => {
        setPrintViewContent('single');
        setAppState(AppState.PRINT_VIEW);
    };
    
    const handleExportAllWorksheets = () => {
        setPrintViewContent('all');
        setAppState(AppState.PRINT_VIEW);
    };

    const handleRetry = () => {
        setCurrentQuiz(shuffleArray(currentQuiz));
        setAppState(AppState.QUIZ);
    };

    const handleExitQuiz = () => {
        setAppState(AppState.SELECT);
    };
    
    const resetApp = () => {
        setAppState(AppState.INPUT);
        setQuiz1Data([]);
        setQuiz2Data([]);
        setQuiz3Data([]);
        setCurrentQuiz([]);
        setCurrentQuizType(null);
        setLearningData([]);
        setVoiceMaterial('');
        setVoiceWordMaterial('');
        setVoiceWordMaterial2('');
        setError(null);
    }

    const renderContent = () => {
        if (isLoading) {
            return <Spinner message={loadingMessage} />;
        }

        switch (appState) {
            case AppState.INPUT:
                const isButtonDisabled = isLoading || !vocabulary.trim();
                
                return (
                    <div className="w-full max-w-2xl mx-auto p-6 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200">
                        <div className="text-center">
                            <div className="flex justify-center items-center gap-4 mb-4">
                                <span className="text-4xl">✏️</span>
                                <h1 className="text-3xl md:text-4xl font-bold text-sky-800">苗栗公館國小資源班<br/>中文詞彙互動測驗產生器</h1>
                                <span className="text-4xl">🌟</span>
                            </div>
                            <p className="text-md text-slate-600 mb-6">請輸入詞彙清單，即可開始學習或進行測驗！</p>
                        </div>

                        <div className="space-y-4">
                             <div className="relative">
                                <textarea
                                    className="w-full h-40 p-4 border-2 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors bg-white text-slate-900 text-lg"
                                    placeholder="請貼上文章段落、句子或詞彙清單，AI 將自動為您提取詞彙！"
                                    value={vocabulary}
                                    onChange={(e) => setVocabulary(e.target.value)}
                                />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <button 
                                        onClick={() => setIsHistoryOpen(true)}
                                        className="text-slate-400 hover:text-sky-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                                        title="輸入記錄"
                                    >
                                        <HistoryIcon className="w-6 h-6" />
                                    </button>
                                </div>
                             </div>

                            <div className="flex items-center justify-center">
                                <input
                                    id="enable-ai-drawing"
                                    type="checkbox"
                                    checked={isImageGenerationEnabled}
                                    onChange={(e) => setIsImageGenerationEnabled(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                                <label htmlFor="enable-ai-drawing" className="ml-2 block text-sm font-medium text-slate-700">
                                    開啟AI智慧繪圖
                                </label>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleOpenImageManager}
                                    disabled={isButtonDisabled}
                                    className="w-full bg-teal-500 text-white font-bold py-3 px-6 rounded-xl text-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    🖼️ 管理圖片
                                </button>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isButtonDisabled}
                                    className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl text-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    🔍 語詞解析
                                </button>
                            </div>


                            {error && <p className="text-red-500 mt-2 text-center font-semibold">{error}</p>}
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 mt-4">
                                <button
                                    onClick={handleGenerateVoiceMaterial}
                                    disabled={isButtonDisabled}
                                    className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl text-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    🔊 語音系統**生字**教材
                                </button>
                                <button
                                    onClick={handleGenerateVoiceWordMaterial}
                                    disabled={isButtonDisabled}
                                    className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-xl text-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    🗣️ 語音系統**語詞**教材
                                </button>
                                 <button
                                    onClick={handleGenerateVoiceWordMaterial2}
                                    disabled={isButtonDisabled}
                                    className="w-full bg-pink-600 text-white font-bold py-3 px-6 rounded-xl text-lg hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-300 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    🗣️ 語音系統**語詞**教材 2
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case AppState.POST_ANALYSIS:
                const isAnyQuizReady = quiz1Data.length > 0 || quiz2Data.length > 0 || quiz3Data.length > 0;
                return (
                    <div className="w-full max-w-lg mx-auto p-8 bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200 text-center">
                        <h2 className="text-3xl font-bold text-sky-800 mb-4">解析完成！</h2>
                        <p className="text-slate-600 mb-8">您現在可以開始學習或進行測驗。</p>

                        <div className="grid grid-cols-1 gap-4">
                             <button
                                onClick={() => setAppState(AppState.LEARN)}
                                className="w-full bg-amber-500 text-white font-bold py-4 px-6 rounded-xl text-lg hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                            >
                                <span className="text-2xl">📚</span> <span>語詞學習</span>
                            </button>
                            <button
                                onClick={() => setAppState(AppState.SELECT)}
                                disabled={!isAnyQuizReady}
                                className="w-full bg-sky-600 text-white font-bold py-4 px-6 rounded-xl text-lg hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                            >
                                <span className="text-2xl">✨</span> <span>進入測驗</span>
                            </button>
                        </div>
                        
                        {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}
                        
                        <button onClick={resetApp} className="mt-8 text-slate-500 hover:text-slate-700 font-semibold transition-colors">
                            &larr; 返回重新輸入
                        </button>
                    </div>
                );
            
            case AppState.LEARN:
                return (
                    <LearningScreen
                        learningData={learningData}
                        speak={speak}
                        onExit={() => setAppState(AppState.POST_ANALYSIS)}
                        onExport={() => setAppState(AppState.PRINT_LEARNING)}
                        imageStyle={imageStyle}
                        isImageGenerationEnabled={isImageGenerationEnabled}
                        customContent={customContent}
                    />
                );

            case AppState.SELECT:
                return (
                    <div className="w-full max-w-md mx-auto text-center">
                        <h2 className="text-3xl font-bold text-slate-800 mb-6">選擇測驗類型</h2>
                        <div className="space-y-4">
                            <button 
                                disabled={quiz1Data.length === 0} 
                                onClick={() => startQuiz(QuizType.DEFINITION)} 
                                className="w-full bg-white text-sky-700 font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg hover:bg-sky-50 transition-all border border-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                測驗一: 語詞解釋配對選擇
                            </button>
                            <button 
                                disabled={quiz2Data.length === 0} 
                                onClick={() => startQuiz(QuizType.SENTENCE)} 
                                className="w-full bg-white text-sky-700 font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg hover:bg-sky-50 transition-all border border-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                測驗二: 語詞例句漏空選擇
                            </button>
                             <button 
                                disabled={quiz3Data.length === 0} 
                                onClick={() => startQuiz(QuizType.CONCEPT)} 
                                className="w-full bg-white text-sky-700 font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg hover:bg-sky-50 transition-all border border-slate-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                測驗三: 語詞概念匹配測驗
                            </button>
                        </div>
                        <div className="mt-6 border-t pt-6">
                            <button onClick={handleExportAllWorksheets} className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 font-semibold py-3 px-6 rounded-lg shadow-sm hover:shadow-md hover:bg-slate-200 transition-all border border-slate-200">
                                <ClipboardIcon className="w-5 h-5" />
                                輸出三種測驗作業單
                            </button>
                        </div>
                         <button onClick={() => setAppState(AppState.POST_ANALYSIS)} className="mt-6 text-slate-500 hover:text-slate-700 transition-colors">
                            &larr; 返回
                        </button>
                    </div>
                );

            case AppState.QUIZ:
                if (!currentQuizType) return null;
                return (
                    <QuizScreen
                        questions={currentQuiz}
                        quizType={currentQuizType}
                        onQuizComplete={handleQuizComplete}
                        speak={speak}
                        onExitQuiz={handleExitQuiz}
                        imageStyle={imageStyle}
                        isImageGenerationEnabled={isImageGenerationEnabled}
                        customContent={customContent}
                    />
                );
            
            case AppState.RESULTS:
                if (!currentQuizType) return null;
                return (
                    <ResultsScreen
                        incorrectQuestions={currentQuiz}
                        onRetry={handleRetry}
                        onExit={handleExitQuiz}
                    />
                );

            case AppState.PRINT_VIEW:
                if (printViewContent === 'all') {
                    return (
                        <Worksheet
                            quiz1={quiz1Data}
                            quiz2={quiz2Data}
                            quiz3={quiz3Data}
                            onBack={() => setAppState(AppState.SELECT)}
                        />
                    );
                }

                // Handle 'single' case
                if (!currentQuizType) return null;

                const singleQuizProps: { quiz1?: Quiz1Question[], quiz2?: Quiz2Question[], quiz3?: Quiz3Question[] } = {};
                if (currentQuizType === QuizType.DEFINITION) {
                    singleQuizProps.quiz1 = quiz1Data;
                } else if (currentQuizType === QuizType.SENTENCE) {
                    singleQuizProps.quiz2 = quiz2Data;
                } else if (currentQuizType === QuizType.CONCEPT) {
                    singleQuizProps.quiz3 = quiz3Data;
                }

                return (
                    <Worksheet
                        {...singleQuizProps}
                        onBack={() => setAppState(AppState.QUIZ)}
                    />
                );
            case AppState.PRINT_LEARNING:
                return (
                    <LearningMaterialPrintView
                        learningData={learningData}
                        onBack={() => setAppState(AppState.LEARN)}
                    />
                );
            
            case AppState.VOICE_MATERIAL:
                return (
                    <MaterialDisplayScreen
                        title="語音系統生字教材"
                        materialText={voiceMaterial}
                        onBack={() => setAppState(AppState.INPUT)}
                    />
                );
            
            case AppState.VOICE_WORD_MATERIAL:
                return (
                    <MaterialDisplayScreen
                        title="語音系統語詞教材"
                        materialText={voiceWordMaterial}
                        onBack={() => setAppState(AppState.INPUT)}
                    />
                );

            case AppState.VOICE_WORD_MATERIAL_2:
                return (
                    <MaterialDisplayScreen
                        title="語音系統語詞教材 2"
                        materialText={voiceWordMaterial2}
                        onBack={() => setAppState(AppState.INPUT)}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4 relative overflow-hidden print:bg-white print:p-0">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob print:hidden"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 print:hidden"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 print:hidden"></div>
            
            <div className="absolute top-4 right-4 flex gap-2 z-20 print:hidden">
                {appState === AppState.QUIZ && (
                    <button onClick={handleExportWorksheet} className="text-slate-500 hover:text-sky-600 transition-colors" title="複製作業單">
                        <ClipboardIcon className="w-8 h-8"/>
                        <span className="sr-only">複製作業單</span>
                    </button>
                )}
                <button onClick={() => setIsSettingsOpen(true)} className="text-slate-500 hover:text-sky-600 transition-colors" title="設定">
                    <SettingsIcon className="w-8 h-8"/>
                    <span className="sr-only">設定</span>
                </button>
            </div>
            <main className="w-full transition-all duration-300 z-10">
                {renderContent()}
            </main>
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                voices={voices}
                ttsSettings={settings}
                onTtsSettingsChange={setSettings}
                imageStyle={imageStyle}
                onImageStyleChange={setImageStyle}
            />
            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onSelect={(itemContent) => {
                    setVocabulary(itemContent);
                    setIsHistoryOpen(false);
                }}
                onDelete={handleDeleteHistoryItemWithContent}
                onClear={handleClearHistoryWithContent}
            />
             <ImageManagerModal
                isOpen={isImageManagerOpen}
                onClose={() => setIsImageManagerOpen(false)}
                words={imageManagerWords}
                customContent={customContent}
                onUpdate={handleCustomContentUpdate}
                onDelete={handleCustomContentDelete}
            />
             <footer className="absolute bottom-4 text-xs text-slate-400 z-10 print:hidden">
                由 Gemini API 驅動
            </footer>
        </div>
    );
};

export default App;
