
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QuizType, IMAGE_STYLES, HistoryItem } from '../types';
import type { QuizQuestion, Quiz1Question, Quiz2Question, Quiz3Question, TTSSettings, ImageStyle, LearningCard, CustomContent } from '../types';
import { generateImageForPrompt, generateSentenceForImage, matchSentencesToWords } from '../services/geminiService';

// --- Sound Effects ---
const CORRECT_SOUND_URL = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaW5nIENTUkFQXlBLU0Y4AAAAAA+VEN5TEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV-';
const INCORRECT_SOUND_URL = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaW5nIENTUkFQXlBLU0Y4AAAAAA+VEN5TEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVJAPVlA8AAAAAADSAAAAAP3///wADAAEAAAABDVV1Vaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq-AmVScVvvvvaaqqqqqqqqqqq-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-..';

// --- Spinner Component ---
export const Spinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-600"></div>
        <p className="mt-4 text-lg text-slate-700 font-semibold">{message}</p>
    </div>
);

// --- Settings Icon Component ---
export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.48.398.668 1.03.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// --- Trash Icon Component (NEW) ---
export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

// --- Image Icon Component (NEW) ---
export const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);


// --- Internal AI Image Component ---
const AIImage: React.FC<{
    prompt: string;
    style: ImageStyle;
    isEnabled: boolean;
}> = ({ prompt, style, isEnabled }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateImage = useCallback(async () => {
        if (!isEnabled || !prompt) return;
        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        try {
            const base64Image = await generateImageForPrompt(prompt, style);
            setImageUrl(`data:image/jpeg;base64,${base64Image}`);
        } catch (err) {
            console.error("Image generation failed:", err);
            setError('圖片生成失敗');
        } finally {
            setIsLoading(false);
        }
    }, [prompt, style, isEnabled]);

    useEffect(() => {
        generateImage();
    }, [generateImage]);
    
    if (!isEnabled) return null;

    return (
        <div className="w-full aspect-square bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative">
            {isLoading && (
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-sky-500"></div>
                    <p className="mt-2 text-sm text-slate-500">AI 繪圖中...</p>
                </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {imageUrl && <img src={imageUrl} alt={prompt} className="w-full h-full object-contain" />}
            {!isLoading && !imageUrl && !error && (
                 <button onClick={generateImage} className="text-slate-500">點擊生成圖片</button>
            )}
        </div>
    );
};


// --- Quiz Screen Component ---
interface QuizScreenProps {
    questions: QuizQuestion[];
    quizType: QuizType;
    onQuizComplete: (incorrectQuestions: QuizQuestion[]) => void;
    speak: (text: string) => void;
    onExitQuiz: () => void;
    imageStyle: ImageStyle;
    isImageGenerationEnabled: boolean;
    customContent: Record<string, CustomContent>;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
    questions,
    quizType,
    onQuizComplete,
    speak,
    onExitQuiz,
    imageStyle,
    isImageGenerationEnabled,
    customContent,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [incorrectQuestions, setIncorrectQuestions] = useState<QuizQuestion[]>([]);

    const correctAudio = new Audio(CORRECT_SOUND_URL);
    const incorrectAudio = new Audio(INCORRECT_SOUND_URL);
    
    const currentQuestion = questions[currentIndex];

    const goToNextQuestion = useCallback(() => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(currentIndex + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            onQuizComplete(incorrectQuestions);
        }
    }, [currentIndex, questions.length, incorrectQuestions, onQuizComplete]);

    const handleOptionClick = useCallback((option: string) => {
        if (selectedOption) return;

        setSelectedOption(option);
        const correctAnswer = currentQuestion.word;

        if (option === correctAnswer) {
            setIsCorrect(true);
            correctAudio.play();
            setTimeout(() => {
                goToNextQuestion();
            }, 800); // Wait 0.8s for feedback before next question
        } else {
            setIsCorrect(false);
            incorrectAudio.play();
            setIncorrectQuestions(prev => [...prev, currentQuestion]);
        }
    }, [selectedOption, currentQuestion, correctAudio, incorrectAudio, goToNextQuestion]);

    const getButtonClass = (option: string) => {
        if (!selectedOption) {
            return "bg-white hover:bg-sky-100 text-slate-800";
        }
        const correctAnswer = currentQuestion.word;

        if (option === correctAnswer) {
            return "bg-green-500 text-white";
        }
        if (option === selectedOption && option !== correctAnswer) {
            return "bg-red-500 text-white";
        }
        return "bg-slate-200 text-slate-500 cursor-not-allowed";
    };

    if (!currentQuestion) {
        return <div>測驗結束！</div>;
    }

    let questionText = '';
    let hint: string | null = null;
    let fullTextToSpeak = '';
    let imagePrompt = '';

    if ('definition' in currentQuestion) { // QuizType 1: Definition to Word
        const q = currentQuestion as Quiz1Question;
        questionText = q.definition;
        fullTextToSpeak = q.definition;
        imagePrompt = q.word;
    } else if ('sentence' in currentQuestion) { // QuizType 2: Sentence Cloze
        const q = currentQuestion as Quiz2Question;
        questionText = q.sentence.split('(')[0].trim();
        hint = q.sentence.match(/\(([^)]+)\)/)?.[1] ?? null;
        fullTextToSpeak = q.sentence;
        imagePrompt = q.sentence.replace('____', q.word);
    } else if ('scenario' in currentQuestion) { // QuizType 3: Concept Match
        const q = currentQuestion as Quiz3Question;
        questionText = q.scenario.split('(')[0].trim();
        hint = q.scenario.match(/\(([^)]+)\)/)?.[1] ?? null;
        fullTextToSpeak = q.scenario;
        imagePrompt = `${q.word} - ${questionText}`;
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-6 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200 relative">
             <button onClick={onExitQuiz} title="離開測驗" className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors z-10 p-1 rounded-full hover:bg-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
                <span className="sr-only">離開測驗</span>
            </button>
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
                 {/* Left Column: Question and Options */}
                <div className="flex-1 w-full">
                    <div className="text-center mb-6">
                        <p className="text-sm font-semibold text-sky-600">第 {currentIndex + 1} / {questions.length} 題</p>
                    </div>
                    
                    <div className="text-center mb-6">
                        <h2 className="text-4xl font-bold text-slate-800 mb-2">{questionText}</h2>
                        {hint && <p className="text-slate-500">{hint}</p>}
                        <button onClick={() => speak(fullTextToSpeak)} className="text-sky-500 mt-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => handleOptionClick(option)}
                                className={`flex items-center justify-between p-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-md ${getButtonClass(option)} ${!selectedOption ? 'cursor-pointer' : ''}`}
                            >
                                <span className="flex-1 text-left">{option}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        speak(option);
                                    }}
                                    disabled={!!selectedOption}
                                    className="p-1 rounded-full transition-colors disabled:opacity-50 hover:bg-black/10"
                                    aria-label={`朗讀選項 ${option}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 min-h-[8rem] flex flex-col items-center justify-center">
                        {selectedOption !== null && isCorrect === true && (
                            <div className="text-center text-green-500 transition-opacity duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="font-bold text-2xl mt-2">答對了！</p>
                            </div>
                        )}
                        {selectedOption !== null && isCorrect === false && (
                            <div className="text-center transition-opacity duration-300">
                                <div className="text-red-500 mb-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="font-bold text-2xl mt-2">答錯了！</p>
                                </div>
                                <p className="text-slate-700 text-lg mb-4">
                                    正確答案是：<span className="font-bold text-sky-700">{currentQuestion.word}</span>
                                </p>
                                <button 
                                    onClick={goToNextQuestion}
                                    className="bg-sky-600 text-white font-bold py-2 px-8 rounded-xl text-lg hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all shadow-lg"
                                >
                                    下一題
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                 {/* Right Column: Image */}
                <div className="w-full md:w-2/5 relative mt-4 md:mt-0">
                    {(() => {
                        const imageWord = currentQuestion.word;
                        const custom = customContent[imageWord];

                        if (custom) {
                            return (
                                <div className="w-full aspect-square bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                                    <img src={custom.imageUrl} alt={imageWord} className="w-full h-full object-contain" />
                                </div>
                            );
                        }
                        
                        if (isImageGenerationEnabled) {
                            return (
                                <AIImage 
                                    prompt={imagePrompt}
                                    style={imageStyle} 
                                    isEnabled={true}
                                />
                            );
                        }

                        return (
                            <div className="w-full aspect-square bg-slate-200 rounded-lg flex items-center justify-center p-4">
                                <p className="text-slate-500 text-center">AI 繪圖已關閉</p>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};


// --- Results Screen Component ---
interface ResultsScreenProps {
    incorrectQuestions: QuizQuestion[];
    onRetry: () => void;
    onExit: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
    incorrectQuestions,
    onRetry,
    onExit,
}) => {
    const hasIncorrect = incorrectQuestions.length > 0;
    
    return (
        <div className="w-full max-w-xl mx-auto p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200 text-center">
            <h2 className="text-4xl font-bold text-sky-800 mb-4">{hasIncorrect ? "再接再厲！" : "恭喜你，全部答對了！"}</h2>
            <p className="text-slate-600 mb-8">{hasIncorrect ? `你答錯了 ${incorrectQuestions.length} 題。` : "你真是個詞彙大師！"}</p>

            {hasIncorrect && (
                <div className="mb-8 text-left p-4 bg-red-50 rounded-lg border border-red-200">
                    <h3 className="font-bold text-lg text-red-800 mb-2">答錯的題目：</h3>
                    <ul className="space-y-2">
                        {incorrectQuestions.map((q, index) => (
                            <li key={index} className="text-red-700">
                                <span className="font-semibold">{q.word}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 justify-center">
                {hasIncorrect && (
                     <button onClick={onRetry} className="w-full md:w-auto bg-amber-500 text-white font-bold py-3 px-8 rounded-xl text-lg hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all shadow-lg">
                        只重考答錯的題目
                    </button>
                )}
                <button onClick={onExit} className="w-full md:w-auto bg-sky-600 text-white font-bold py-3 px-8 rounded-xl text-lg hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all shadow-lg">
                    返回
                </button>
            </div>
        </div>
    );
};

// --- Settings Modal Component ---
interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    voices: SpeechSynthesisVoice[];
    ttsSettings: TTSSettings;
    onTtsSettingsChange: (settings: TTSSettings) => void;
    imageStyle: ImageStyle;
    onImageStyleChange: (style: ImageStyle) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    voices,
    ttsSettings,
    onTtsSettingsChange,
    imageStyle,
    onImageStyleChange
}) => {
    if (!isOpen) return null;

    const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedVoice = voices.find(v => v.name === e.target.value) || null;
        onTtsSettingsChange({ ...ttsSettings, voice: selectedVoice });
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onTtsSettingsChange({ ...ttsSettings, rate: parseFloat(e.target.value) });
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">設定</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">語音設定 (TTS)</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="voice-select" className="block text-sm font-medium text-slate-600 mb-1">聲音</label>
                                <select 
                                    id="voice-select" 
                                    value={ttsSettings.voice?.name || ''} 
                                    onChange={handleVoiceChange}
                                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                                >
                                    <option value="">選擇一個聲音</option>
                                    {voices.map(voice => (
                                        <option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="rate-slider" className="block text-sm font-medium text-slate-600 mb-1">速度: {ttsSettings.rate.toFixed(1)}x</label>
                                <input 
                                    type="range" 
                                    id="rate-slider"
                                    min="0.5" 
                                    max="2" 
                                    step="0.1" 
                                    value={ttsSettings.rate}
                                    onChange={handleRateChange}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">AI 繪圖風格</h3>
                        <select 
                            value={imageStyle} 
                            onChange={(e) => onImageStyleChange(e.target.value as ImageStyle)}
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                        >
                            {IMAGE_STYLES.map(style => (
                                <option key={style} value={style}>{style}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Learning Screen Component ---
interface LearningScreenProps {
    learningData: LearningCard[];
    speak: (text: string) => void;
    onExit: () => void;
    onExport: () => void;
    imageStyle: ImageStyle;
    isImageGenerationEnabled: boolean;
    customContent: Record<string, CustomContent>;
}

export const LearningScreen: React.FC<LearningScreenProps> = ({
    learningData,
    speak,
    onExit,
    onExport,
    imageStyle,
    isImageGenerationEnabled,
    customContent,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imagePrompt, setImagePrompt] = useState('');
    const card = learningData[currentIndex];

    useEffect(() => {
        if (card) {
            const custom = customContent[card.word];
            // Use the custom sentence for the image prompt if available, otherwise use the first sentence.
            setImagePrompt(custom?.sentence || card.sentences?.[0] || card.word);
        }
    }, [card, customContent]);

    const goToNext = () => {
        setCurrentIndex(prev => (prev + 1) % learningData.length);
    };

    const goToPrev = () => {
        setCurrentIndex(prev => (prev - 1 + learningData.length) % learningData.length);
    };
    
    if (!card) {
        return (
            <div className="text-center p-8">
                <p className="text-slate-600">沒有學習資料。</p>
                <button onClick={onExit} className="mt-4 bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700">
                    返回
                </button>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-5xl mx-auto relative">
             <div className="absolute top-0 -left-20 text-slate-500 text-sm">
                <p>第 {currentIndex + 1} / {learningData.length} 張</p>
             </div>
             <div className="absolute top-0 -right-20 flex flex-col gap-2 z-10">
                <button onClick={onExit} title="離開學習" className="text-slate-400 hover:text-slate-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    <span className="sr-only">離開學習</span>
                </button>
                <button onClick={onExport} title="輸出學習單" className="text-slate-400 hover:text-slate-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m4 6h.01" />
                    </svg>
                    <span className="sr-only">輸出學習單</span>
                </button>
             </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-slate-200 p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Left Column: Text Content */}
                    <div className="flex-1 w-full">
                        <div className="text-center md:text-left">
                            <h2 className="text-5xl font-bold text-slate-800 mb-2">{card.word}</h2>
                             <button onClick={() => speak(card.word)} className="text-sky-500 mb-4 inline-block mx-auto md:mx-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                            </button>
                        </div>
                        
                        <div className="my-4 p-4 bg-sky-50/70 rounded-lg border border-sky-200">
                            {card.charDefinitions && card.charDefinitions.length > 0 && (
                                <div className="mb-3 pb-3 border-b border-sky-200 text-lg flex flex-wrap items-center gap-x-4 gap-y-2">
                                    {card.charDefinitions.map((def, i) => (
                                        <div key={i} className="inline-flex items-center">
                                            <span>
                                                <strong className="text-sky-700 font-semibold">{def.char}:</strong>
                                                <span className="text-slate-700"> {def.definition}</span>
                                            </span>
                                            <button
                                                onClick={() => speak(`${def.char}，${def.definition}`)}
                                                className="text-sky-500 hover:text-sky-700 ml-1 p-1"
                                                aria-label={`朗讀 ${def.char} 的解釋`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-start gap-2 pt-2">
                                <p className="text-slate-600 text-lg flex-1">
                                    <strong className="font-semibold text-sky-800">意思是：</strong>{card.definition}
                                </p>
                                <button onClick={() => speak(card.definition)} className="text-sky-500 hover:text-sky-700 flex-shrink-0 mt-1" aria-label="朗讀解釋">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {card.sentences.map((sentence, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 bg-slate-100/70 rounded-lg">
                                    <span className="text-sky-600 font-bold">{i + 1}.</span>
                                    <p className="text-slate-800 flex-1">{sentence}</p>
                                     <button 
                                        onClick={() => setImagePrompt(sentence)} 
                                        className="text-amber-500 hover:text-amber-600 p-1 flex items-center justify-center rounded-full transition-colors" 
                                        aria-label={`為這句產生圖片`}
                                     >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10 3.5a1.5 1.5 0 011.06.44l4.25 4.25a1.5 1.5 0 010 2.12l-4.25 4.25a1.5 1.5 0 01-2.12-2.12L11.88 10 8.94 7.06a1.5 1.5 0 011.06-2.56zM4 6.5a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 010 3H5.5A1.5 1.5 0 014 6.5z" />
                                          <path d="M5.5 12.5a1.5 1.5 0 000 3h1.5a1.5 1.5 0 000-3H5.5z" />
                                          <path d="M10 12.5a1.5 1.5 0 000 3h4.5a1.5 1.5 0 000-3H10z" />
                                        </svg>
                                    </button>
                                     <button onClick={() => speak(sentence)} className="text-sky-500 hover:text-sky-700 p-1" aria-label="朗讀例句">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Right Column: Image */}
                    <div className="w-full md:w-2/5 relative">
                       {(() => {
                            const custom = customContent[card.word];
                            if (custom) {
                                return (
                                    <div className="w-full aspect-square bg-slate-200 rounded-lg overflow-hidden">
                                        <img src={custom.imageUrl} alt={card.word} className="w-full h-full object-contain" />
                                    </div>
                                );
                            }
                            if (isImageGenerationEnabled) {
                                return (
                                    <AIImage 
                                        key={imagePrompt}
                                        prompt={imagePrompt} 
                                        style={imageStyle} 
                                        isEnabled={!!imagePrompt}
                                    />
                                );
                            }
                            return (
                                <div className="w-full aspect-square bg-slate-200 rounded-lg flex items-center justify-center p-4">
                                    <p className="text-slate-500 text-center">AI 繪圖已關閉</p>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
            
             {/* Navigation */}
            <div className="flex justify-between items-center mt-6">
                <button onClick={goToPrev} className="bg-white p-3 rounded-full shadow-md hover:bg-slate-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={goToNext} className="bg-white p-3 rounded-full shadow-md hover:bg-slate-100 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
};

// --- Worksheet Component (NEW) ---
interface WorksheetProps {
    quiz1?: Quiz1Question[];
    quiz2?: Quiz2Question[];
    quiz3?: Quiz3Question[];
    onBack: () => void;
}

// Helper to shuffle arrays, needed for worksheet generation
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const generateWorksheetText = (quizzes: {
    quiz1?: Quiz1Question[];
    quiz2?: Quiz2Question[];
    quiz3?: Quiz3Question[];
}): string => {
    let fullText = "中文詞彙作業單\n\n";
    fullText += `姓名：____________________\n`;
    fullText += `日期：______ 年 ______ 月 ______ 日\n\n`;
    
    let hasContent = false;

    const processQuiz = (
        title: string,
        questions: QuizQuestion[] | undefined,
        formatter: (q: any, counter: number) => string
    ) => {
        if (!questions || questions.length === 0) return;
        
        hasContent = true;
        fullText += `====================\n`;
        fullText += `${title}\n`;
        fullText += `====================\n\n`;

        const shuffledQuestions = shuffleArray(questions);
        let answerKey = `\n--- 解答 ---\n`;

        shuffledQuestions.forEach((q, index) => {
            const counter = index + 1;
            fullText += formatter(q, counter);

            const correctOptionIndex = q.options.indexOf(q.word);
            if (correctOptionIndex !== -1) {
                const correctLetter = String.fromCharCode(65 + correctOptionIndex);
                answerKey += `${counter}. (${correctLetter})  `;
            }
        });
        
        fullText += answerKey.trim() + '\n\n';
    };

    processQuiz(
        '測驗一: 語詞解釋配對選擇',
        quizzes.quiz1,
        (q: Quiz1Question, counter: number) => {
            const options = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('   ');
            return `${counter}. (   ) ${q.definition}\n   ${options}\n\n`;
        }
    );

    processQuiz(
        '測驗二: 語詞例句漏空選擇',
        quizzes.quiz2,
        (q: Quiz2Question, counter: number) => {
            const options = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('   ');
            return `${counter}. ${q.sentence.replace('____', '(____)')}\n   ${options}\n\n`;
        }
    );

    processQuiz(
        '測驗三: 語詞概念匹配測驗',
        quizzes.quiz3,
        (q: Quiz3Question, counter: number) => {
            const options = q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('   ');
            return `${counter}. ${q.scenario}\n   ${options}\n\n`;
        }
    );

    if (!hasContent) {
        return "沒有可用的測驗題目可供輸出。";
    }

    return fullText;
};


export const Worksheet: React.FC<WorksheetProps> = ({ quiz1, quiz2, quiz3, onBack }) => {
    const [copySuccess, setCopySuccess] = useState('');
    const worksheetText = useMemo(() => {
        const quizzesToGenerate: {
            quiz1?: Quiz1Question[];
            quiz2?: Quiz2Question[];
            quiz3?: Quiz3Question[];
        } = {};
        if (quiz1) quizzesToGenerate.quiz1 = quiz1;
        if (quiz2) quizzesToGenerate.quiz2 = quiz2;
        if (quiz3) quizzesToGenerate.quiz3 = quiz3;
        return generateWorksheetText(quizzesToGenerate);
    }, [quiz1, quiz2, quiz3]);


    const handleCopy = () => {
        navigator.clipboard.writeText(worksheetText).then(() => {
            setCopySuccess('已成功複製！');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('複製失敗。');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };
    
    const handlePrint = () => {
        window.print();
    };


    return (
        <div 
             className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:bg-white print:backdrop-blur-none" 
             onClick={onBack}
        >
            <div 
                 className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl flex flex-col print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-full print:h-full" 
                 onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <h2 className="text-2xl font-bold text-slate-800">作業單內容</h2>
                    <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div
                    className="w-full flex-grow h-96 p-3 border border-slate-300 rounded-md bg-slate-50 font-mono text-sm resize-none overflow-auto print:h-auto print:overflow-visible print:border-none print:p-0"
                    style={{ whiteSpace: 'pre-wrap' }}
                >
                  {worksheetText}
                </div>

                <div className="flex justify-end items-center mt-4 gap-4 print:hidden">
                    {copySuccess && <span className="text-green-600 transition-opacity duration-300">{copySuccess}</span>}
                     <button 
                        onClick={handlePrint} 
                        className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-4 focus:ring-green-300"
                    >
                        導出PDF
                    </button>
                    <button 
                        onClick={handleCopy} 
                        className="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-4 focus:ring-sky-300"
                    >
                        複製文字
                    </button>
                    <button 
                        onClick={onBack} 
                        className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Learning Material Print View Component ---
interface LearningMaterialPrintViewProps {
    learningData: LearningCard[];
    onBack: () => void;
}

const generateLearningMaterialText = (cards: LearningCard[]): string => {
    let fullText = "";

    if (!cards || cards.length === 0) {
        return "沒有學習資料可供輸出。";
    }

    cards.forEach((card, index) => {
        fullText += `====================\n`;
        fullText += `詞彙 ${index + 1}: ${card.word}\n`;
        fullText += `====================\n\n`;

        if (card.charDefinitions && card.charDefinitions.length > 0) {
            fullText += "【個別字義】\n";
            card.charDefinitions.forEach(def => {
                fullText += `  - (${def.char}): [${def.definition}]\n`;
            });
            fullText += "\n";
        }

        fullText += `【語詞意思】\n  [${card.definition}]\n\n`;

        if (card.sentences && card.sentences.length > 0) {
            fullText += "【例句】\n";
            card.sentences.forEach((sentence, i) => {
                fullText += `  ${i + 1}. [${sentence}]\n`;
            });
        }
        
        if (index < cards.length - 1) {
            fullText += "\n\n";
        }
    });

    return fullText;
};

export const LearningMaterialPrintView: React.FC<LearningMaterialPrintViewProps> = ({ learningData, onBack }) => {
    const [copySuccess, setCopySuccess] = useState('');
    const materialText = useMemo(() => generateLearningMaterialText(learningData), [learningData]);

    const handleCopy = () => {
        navigator.clipboard.writeText(materialText).then(() => {
            setCopySuccess('已成功複製！');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('複製失敗。');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <div 
             className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:bg-white print:backdrop-blur-none" 
             onClick={onBack}
        >
            <div 
                 className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl flex flex-col print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-full print:h-full" 
                 onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <h2 className="text-2xl font-bold text-slate-800">學習單內容</h2>
                    <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div
                    className="w-full flex-grow h-96 p-3 border border-slate-300 rounded-md bg-slate-50 font-mono text-sm resize-none overflow-auto print:h-auto print:overflow-visible print:border-none print:p-0"
                    style={{ whiteSpace: 'pre-wrap' }}
                >
                  {materialText}
                </div>

                <div className="flex justify-end items-center mt-4 gap-4 print:hidden">
                    {copySuccess && <span className="text-green-600 transition-opacity duration-300">{copySuccess}</span>}
                     <button 
                        onClick={handlePrint} 
                        className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-4 focus:ring-green-300"
                    >
                        導出PDF
                    </button>
                    <button 
                        onClick={handleCopy} 
                        className="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-4 focus:ring-sky-300"
                    >
                        複製文字
                    </button>
                    <button 
                        onClick={onBack} 
                        className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Material Display Screen Component (Refactored) ---
interface MaterialDisplayScreenProps {
    title: string;
    materialText: string;
    onBack: () => void;
}

export const MaterialDisplayScreen: React.FC<MaterialDisplayScreenProps> = ({ title, materialText, onBack }) => {
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(materialText).then(() => {
            setCopySuccess('已成功複製！');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('複製失敗。');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <div 
             className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
             onClick={onBack}
        >
            <div 
                 className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl flex flex-col" 
                 onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
                    <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <textarea
                    readOnly
                    className="w-full flex-grow h-96 p-3 border border-slate-300 rounded-md bg-slate-50 font-mono text-sm resize-y"
                    value={materialText}
                />
                <div className="flex justify-end items-center mt-4 gap-4">
                    {copySuccess && <span className="text-green-600 transition-opacity duration-300">{copySuccess}</span>}
                    <button 
                        onClick={handleCopy} 
                        className="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-4 focus:ring-sky-300"
                    >
                        複製內容
                    </button>
                    <button 
                        onClick={onBack} 
                        className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- History Modal Component (NEW) ---
interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onSelect: (itemContent: string) => void;
    onDelete: (index: number) => void;
    onClear: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onSelect, onDelete, onClear }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">輸入記錄</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-grow h-96 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-2">
                    {history.length > 0 ? (
                        history.map((item, index) => (
                            <div key={index} className="group flex items-center justify-between p-3 bg-white rounded-md shadow-sm hover:bg-sky-50 cursor-pointer" onClick={() => onSelect(item.content)}>
                                <p className="text-slate-700 truncate flex-1 pr-4 font-medium">{item.name}</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(index);
                                    }}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                    title="刪除此紀錄"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <p>沒有任何記錄</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-4">
                    {history.length > 0 ? (
                        <button
                            onClick={onClear}
                            className="text-sm text-red-500 hover:text-red-700 hover:underline"
                        >
                            清除所有記錄
                        </button>
                    ) : (
                        <div /> // Placeholder for alignment
                    )}
                    <button
                        onClick={onClose}
                        className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Sentence Input Dialog (NEW) ---
interface SentenceInputDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (sentencesText: string) => void;
}

export const SentenceInputDialog: React.FC<SentenceInputDialogProps> = ({ isOpen, onClose, onSubmit }) => {
    const [text, setText] = useState('');

    useEffect(() => {
        if (isOpen) {
            setText('');
        }
    }, [isOpen]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">提供專屬例句 (選填)</h2>
                <p className="text-slate-500 mb-4">請為您上傳的圖片提供對應的例句。系統會優先使用您提供的內容，若留空則由 AI 自動產生。</p>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full flex-grow h-64 p-3 border border-slate-300 rounded-md bg-slate-50 font-mono text-sm resize-y"
                    placeholder="請在此輸入您的例句，AI 會自動為您配對。您可以一次貼上多個句子。"
                />
                <div className="flex justify-end items-center mt-4 gap-4">
                    <button 
                        onClick={onClose} 
                        className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        全部使用 AI 自動產生
                    </button>
                    <button 
                        onClick={() => onSubmit(text)} 
                        className="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-4 focus:ring-sky-300"
                    >
                        確定並處理
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Image Manager Modal Component (REFACTORED) ---
interface ImageManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    words: string[];
    customContent: Record<string, CustomContent>;
    onUpdate: (word: string, content: CustomContent) => void;
    onDelete: (word: string) => void;
}

type UploadStatus = {
    status: 'idle' | 'processing' | 'done' | 'error';
    message: string;
};

type PendingFile = {
    file: File;
    word: string;
};


export const ImageManagerModal: React.FC<ImageManagerModalProps> = ({ isOpen, onClose, words, customContent, onUpdate, onDelete }) => {
    const [uploadStatus, setUploadStatus] = useState<Record<string, UploadStatus>>({});
    const [isSentenceInputOpen, setIsSentenceInputOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [sessionWords, setSessionWords] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setSessionWords([]);
            setUploadStatus({});
        }
    }, [isOpen]);

    const displayedWords = useMemo(() => {
        return [...new Set([...words, ...sessionWords])].sort();
    }, [words, sessionWords]);
    
    const processFiles = async (filesToProcess: PendingFile[], sentencesText: string) => {
        let matchedSentences: Record<string, string> = {};

        if (sentencesText.trim()) {
            try {
                const wordsToMatch = filesToProcess.map(f => f.word);
                matchedSentences = await matchSentencesToWords(wordsToMatch, sentencesText);
            } catch (err) {
                console.error("Sentence matching failed:", err);
            }
        }

        for (const { file, word } of filesToProcess) {
            setUploadStatus(prev => ({ ...prev, [word]: { status: 'processing', message: '讀取檔案中...' } }));

            try {
                const imageDataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                let finalSentence = matchedSentences[word];

                if (finalSentence) {
                    setUploadStatus(prev => ({ ...prev, [word]: { status: 'processing', message: '使用配對的例句...' } }));
                } else {
                    setUploadStatus(prev => ({ ...prev, [word]: { status: 'processing', message: 'AI 圖片分析產生例句中...' } }));
                    const imageBase64 = imageDataUrl.split(',')[1];
                    const mimeType = imageDataUrl.match(/data:([^;]+);/)?.[1] || 'image/png';
                    finalSentence = await generateSentenceForImage(word, imageBase64, mimeType);
                }
                
                if (finalSentence) {
                    onUpdate(word, { imageUrl: imageDataUrl, sentence: finalSentence });
                    setUploadStatus(prev => ({ ...prev, [word]: { status: 'done', message: '完成！' } }));
                } else {
                    throw new Error("AI 無法產生例句");
                }
            } catch (err) {
                console.error(err);
                const errorMessage = err instanceof Error ? err.message : '處理失敗';
                setUploadStatus(prev => ({ ...prev, [word]: { status: 'error', message: errorMessage } }));
            }
        }
    };
    
    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const filesToProcess = Array.from(files)
            .map(file => ({
                file,
                word: file.name.split('.').slice(0, -1).join('.').trim()
            }));

        if (filesToProcess.length > 0) {
            const newWords = filesToProcess.map(f => f.word);
            setSessionWords(prev => [...new Set([...prev, ...newWords])]);
            setPendingFiles(filesToProcess);
            setIsSentenceInputOpen(true);
        }
        e.target.value = '';
    };

    const handleSentenceSubmit = (sentencesText: string) => {
        setIsSentenceInputOpen(false);
        processFiles(pendingFiles, sentencesText);
        setPendingFiles([]);
    };

    const handleDelete = (wordToDelete: string) => {
        onDelete(wordToDelete);
        setSessionWords(prev => prev.filter(w => w !== wordToDelete));
    };
    
    const getStatusColor = (status: UploadStatus['status']) => {
        switch (status) {
            case 'processing': return 'text-amber-600';
            case 'done': return 'text-green-600';
            case 'error': return 'text-red-600';
            default: return 'text-slate-500';
        }
    };

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-2xl font-bold text-slate-800">管理詞彙圖片</h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">上傳圖片並自動產生圖文相符的例句。請確保圖片檔名與詞彙完全一致 (例如：如釋重負.png)。</p>
                        
                        <div className="mb-4">
                            <label className="w-full text-center cursor-pointer bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-4 focus:ring-sky-300 block">
                                批次上傳圖片 (可一次選取多張)
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelection} />
                            </label>
                        </div>

                        <div className="flex-grow h-96 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2 space-y-2">
                            {displayedWords.length > 0 ? (
                                displayedWords.map((word) => {
                                    const content = customContent[word];
                                    const status = uploadStatus[word];
                                    return (
                                        <div key={word} className="grid grid-cols-3 items-center gap-4 p-3 bg-white rounded-md shadow-sm">
                                            <div className="flex items-center gap-3">
                                                {content ? (
                                                    <div className="relative group flex-shrink-0">
                                                        <img src={content.imageUrl} alt={word} className="w-16 h-16 object-cover rounded-md border border-slate-200" />
                                                        <button 
                                                            onClick={() => handleDelete(word)} 
                                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                            title="刪除">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center text-slate-400 flex-shrink-0">
                                                        <ImageIcon className="w-8 h-8"/>
                                                    </div>
                                                )}
                                                <span className="text-lg font-semibold text-slate-800">{word}</span>
                                            </div>
                                            <div className="col-span-2">
                                                {status && (
                                                    <div className={`text-sm font-semibold mb-1 ${getStatusColor(status.status)}`}>
                                                        {status.message}
                                                    </div>
                                                )}
                                                <p className="text-sm text-slate-600">
                                                    {content?.sentence || (status?.status === 'processing' ? ' ' : '尚未產生專屬例句。')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    <p>尚未上傳任何圖片。請點擊上方按鈕開始上傳。</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end items-center mt-4">
                            <button 
                                onClick={onClose} 
                                className="bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-4 focus:ring-sky-300"
                            >
                                完成
                            </button>
                        </div>
                    </div>
                </div>
            )}
             <SentenceInputDialog
                isOpen={isSentenceInputOpen}
                onClose={() => {
                    setIsSentenceInputOpen(false);
                    processFiles(pendingFiles, '');
                    setPendingFiles([]);
                }}
                onSubmit={handleSentenceSubmit}
            />
        </>
    );
};
