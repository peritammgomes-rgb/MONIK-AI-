
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveServerMessage, LiveSession } from '@google/genai';
import { createLiveSession, decode, decodeAudioData, createPcmBlob } from '../services/geminiService';
import { MicrophoneIcon, StopCircleIcon, PlayCircleIcon } from './icons/Icons';

type TranscriptionEntry = {
    speaker: 'user' | 'model';
    text: string;
}

const LiveChat: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
    const [currentTranscription, setCurrentTranscription] = useState<TranscriptionEntry | null>(null);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');

    const stopConversation = useCallback(async () => {
        setIsActive(false);
        setIsConnecting(false);
        
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            }
            sessionPromiseRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            await inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
             sourcesRef.current.forEach(source => source.stop());
             sourcesRef.current.clear();
             await outputAudioContextRef.current.close();
             outputAudioContextRef.current = null;
        }
    }, []);

    const startConversation = async () => {
        if (isActive || isConnecting) return;
        setIsConnecting(true);
        setError(null);
        setTranscriptionHistory([]);
        setCurrentTranscription(null);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Seu navegador não suporta a API de Mídia. Tente no Chrome.");
            }
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;

            sessionPromiseRef.current = createLiveSession({
                onOpen: () => {
                    if (!inputAudioContextRef.current || !streamRef.current) return;
                    
                    const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        if(sessionPromiseRef.current) {
                            sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    source.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    setIsConnecting(false);
                    setIsActive(true);
                },
                onMessage: async (message: LiveServerMessage) => {
                    handleMessage(message);
                },
                onError: (e: ErrorEvent) => {
                    console.error("Session error:", e);
                    setError("Ocorreu um erro na conexão. Tente novamente.");
                    stopConversation();
                },
                onClose: (e: CloseEvent) => {
                    stopConversation();
                },
            });
            await sessionPromiseRef.current;
        } catch (e) {
            console.error("Failed to start conversation", e);
            setError(`Falha ao iniciar: ${e instanceof Error ? e.message : String(e)}`);
            setIsConnecting(false);
        }
    };
    
    const handleMessage = async (message: LiveServerMessage) => {
        let inputUpdated = false;
        let outputUpdated = false;

        if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputTranscription.current += text;
            inputUpdated = true;
        }
         if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            currentOutputTranscription.current += text;
            outputUpdated = true;
        }

        if (inputUpdated) {
             setCurrentTranscription({ speaker: 'user', text: currentInputTranscription.current });
        }
        if (outputUpdated) {
            setCurrentTranscription({ speaker: 'model', text: currentOutputTranscription.current });
        }

        if (message.serverContent?.turnComplete) {
            const fullInput = currentInputTranscription.current;
            const fullOutput = currentOutputTranscription.current;
            
            setTranscriptionHistory(prev => {
                let history = [...prev];
                if(fullInput.trim()) history.push({speaker: 'user', text: fullInput});
                if(fullOutput.trim()) history.push({speaker: 'model', text: fullOutput});
                return history;
            });

            currentInputTranscription.current = '';
            currentOutputTranscription.current = '';
            setCurrentTranscription(null);
        }

        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
            const source = outputAudioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContextRef.current.destination);
            source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
            });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            sourcesRef.current.add(source);
        }
    };

    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    return (
        <div className="flex flex-col h-full items-center justify-center p-4 bg-white dark:bg-slate-800 text-center">
            <div className="flex-grow w-full overflow-y-auto space-y-2 p-2">
                {transcriptionHistory.map((item, index) => (
                    <div key={index} className={`w-full flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-2 rounded-lg text-sm ${item.speaker === 'user' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-right' : 'bg-slate-100 dark:bg-slate-700/50 text-left'}`}>
                           {item.text}
                        </div>
                    </div>
                ))}
                {currentTranscription && (
                     <div className={`w-full flex ${currentTranscription.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 italic ${currentTranscription.speaker === 'user' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-right' : 'bg-slate-100 dark:bg-slate-700/50 text-left'}`}>
                           {currentTranscription.text}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 space-y-4">
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                {!isActive && !isConnecting && (
                    <button onClick={startConversation} title="Iniciar conversa por voz" className="bg-green-500 text-white px-6 py-3 rounded-full flex items-center gap-2 font-semibold shadow-lg hover:bg-green-600 transition">
                        <PlayCircleIcon className="h-6 w-6"/>
                        Iniciar Conversa
                    </button>
                )}
                {isConnecting && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Conectando...
                    </div>
                )}
                {isActive && (
                    <>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute h-16 w-16 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
                            <MicrophoneIcon className="relative h-8 w-8 text-indigo-500"/>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Ouvindo...</p>
                        <button onClick={stopConversation} title="Encerrar conversa" className="bg-red-500 text-white px-6 py-3 rounded-full flex items-center gap-2 font-semibold shadow-lg hover:bg-red-600 transition">
                            <StopCircleIcon className="h-6 w-6"/>
                            Encerrar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default LiveChat;