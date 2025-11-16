import { GoogleGenAI, Chat, LiveSession, LiveServerMessage, Modality, Blob, Type } from "@google/genai";
import { Transaction, Category, TransactionType, FinancialAnalysis, BusinessFinancialAnalysis } from '../types';

let ai: GoogleGenAI;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

// Chat functionality
let chat: Chat | null = null;

const SYSTEM_INSTRUCTION = `Você é a Monik AI, uma assistente virtual especializada em educação financeira pessoal e gestão financeira para micro e pequenas empresas.
Sua persona é de uma mentora: profissional, prática e acolhedora. Responda com linguagem clara.
Sua abordagem deve ser conversacional. Em vez de fornecer todas as informações de uma vez, faça perguntas para entender melhor a necessidade do usuário. Guie a conversa passo a passo. Por exemplo, se um usuário pedir para 'analisar minhas finanças', você pode responder com 'Claro! Fico feliz em ajudar. Você gostaria de focar nas suas despesas, receitas, ou ter uma visão geral?'
Regras de Privacidade: NUNCA solicite dados sensíveis como CPF, senhas ou números de cartão. Se um usuário inserir dados sensíveis, peça para que ele anonimize a informação e explique a importância da privacidade.
Estrutura da Resposta: Sempre ofereça uma ação concreta (um passo a passo curto) e uma métrica para avaliar o resultado.
Hierarquia de Categorias: Ao categorizar, use a hierarquia (categoria pai → subcategoria) e explique por que sugeriu cada categoria.
Precificação: Ao calcular preços, explique o custo variável, custo fixo alocado, margem alvo e preço sugerido. Entregue a fórmula e um exemplo.
Reservas Financeiras: Sugira 3 níveis (curto prazo, médio prazo, emergência) com valores absolutos e percentuais da receita.
Índices de Empresa (KPIs): Entregue pelo menos 4 KPIs (Fluxo de Caixa Líquido, Margem Bruta, Cobertura de Custos Fixos, Giro de Caixa) com interpretação simples.
Finalização: Sempre finalize a resposta com 3 micro-tarefas (um desafio) para o usuário aplicar na próxima semana.`;


export const getChat = (): Chat => {
    if (!chat) {
        chat = getAI().chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
    }
    return chat;
}

export const getGroundedResponse = async (prompt: string) => {
    try {
        const response = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        return { text: response.text, groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
    } catch (error) {
        console.error("Error getting grounded response:", error);
        return { text: "Desculpe, não consegui pesquisar a informação no momento." };
    }
};

export const analyzeBusinessDataWithGemini = async (transactions: Transaction[]) => {
    const prompt = `Com base nas seguintes transações, por favor, calcule os KPIs (Fluxo de Caixa Líquido, Margem Bruta, Cobertura de Custos Fixos, Giro de Caixa), sugira a criação de reservas financeiras e forneça uma análise geral da saúde financeira da empresa. Transações: ${JSON.stringify(transactions)}`;
    try {
        const chat = getChat();
        const response = await chat.sendMessage({ message: prompt });
        return response.text;
    } catch (error) {
        console.error("Error analyzing business data:", error);
        return "Desculpe, não consegui analisar os dados no momento.";
    }
};

export const suggestCategoryForTransaction = async (description: string, type: TransactionType, categories: Category): Promise<{ category: string; subCategory: string }> => {
    const prompt = `Você é um assistente financeiro. Analise a descrição da transação: "${description}".
Esta é uma transação do tipo "${type === 'income' ? 'entrada' : 'saída'}".
Com base na lista de categorias JSON a seguir, onde as chaves são categorias e os valores são arrays de subcategorias, retorne a categoria e subcategoria mais apropriada.
Se nenhuma subcategoria se encaixar, retorne a subcategoria encontrada que seja mais próxima ou uma string vazia para subcategoria.

Categorias disponíveis: ${JSON.stringify(categories)}

Responda APENAS com o objeto JSON.`;

    try {
        const response = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        subCategory: { type: Type.STRING, description: "Subcategoria sugerida. Deixe em branco se não houver uma aplicável." }
                    },
                    required: ['category']
                }
            }
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error suggesting category:", error);
        throw new Error("Não foi possível sugerir uma categoria.");
    }
};

// Helper to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read file as base64 string."));
            }
        };
        reader.onerror = error => reject(error);
    });
};

export const extractTransactionDetailsFromImage = async (imageFile: File): Promise<{ description: string; amount: number; date: string }> => {
    const base64Image = await fileToBase64(imageFile);
    const imagePart = {
        inlineData: {
            mimeType: imageFile.type,
            data: base64Image,
        },
    };
    
    const textPart = {
        text: `Analise a imagem deste recibo. Extraia o nome do estabelecimento ou uma breve descrição da compra, o valor total pago e a data da transação. A data deve estar no formato AAAA-MM-DD.`
    };

    try {
        const response = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { 
                            type: Type.STRING,
                            description: "Nome do estabelecimento ou breve descrição da compra."
                        },
                        amount: { 
                            type: Type.NUMBER,
                            description: "O valor total da transação."
                        },
                        date: {
                            type: Type.STRING,
                            description: "A data da transação no formato AAAA-MM-DD."
                        }
                    },
                    required: ['description', 'amount', 'date']
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (typeof result.description !== 'string' || typeof result.amount !== 'number' || typeof result.date !== 'string') {
            throw new Error("Resposta da IA com formato inválido.");
        }
        
        if (!/^\d{4}-\d{2}-\d{2}$/.test(result.date)) {
            console.warn("Data extraída da IA não está no formato AAAA-MM-DD:", result.date);
            result.date = new Date().toISOString().split('T')[0];
        }

        return result;

    } catch (error) {
        console.error("Error extracting details from image:", error);
        throw new Error("Não foi possível extrair os detalhes do recibo.");
    }
};

export const generateFinancialAnalysis = async (
    transactions: Transaction[], 
    panel: 'personal' | 'business',
    businessActivity?: string
): Promise<FinancialAnalysis | BusinessFinancialAnalysis> => {
    if (panel === 'business') {
        const prompt = `Você é um consultor financeiro especialista em pequenas empresas. Com base nestas transações de uma empresa no ramo de "${businessActivity || 'não informado'}", gere uma análise de fluxo de caixa.

Transações: ${JSON.stringify(transactions)}

Calcule todos os valores para a estrutura de fluxo de caixa. Interprete os KPIs para um leigo. A análise contextualizada deve ser específica para o ramo de atividade informado.

Responda APENAS com um objeto JSON. A análise deve incluir:
1. 'cashFlow': um objeto com 'totalRevenue', 'totalVariableCosts', 'contributionMargin', 'totalFixedCosts', 'operatingResult', 'nonOperationalIncome', 'nonOperationalExpenses', 'netResult'.
2. 'kpis': Um array de objetos com 'name', 'value' (como string, ex: "R$ 1.500,00" ou "45%") e 'interpretation' para: Margem de Contribuição, Ponto de Equilíbrio, e Lucratividade.
3. 'tailoredAnalysis': Uma análise curta (2-3 frases) sobre a saúde financeira, contextualizada para o ramo de atividade.
4. 'tips': Um array com 3 dicas práticas.
5. 'suggestedGoals': Um array com 3 metas financeiras mensuráveis.
`;
        try {
             const response = await getAI().models.generateContent({
                model: "gemini-2.5-pro",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            cashFlow: {
                                type: Type.OBJECT,
                                properties: {
                                    totalRevenue: { type: Type.NUMBER },
                                    totalVariableCosts: { type: Type.NUMBER },
                                    contributionMargin: { type: Type.NUMBER },
                                    totalFixedCosts: { type: Type.NUMBER },
                                    operatingResult: { type: Type.NUMBER },
                                    nonOperationalIncome: { type: Type.NUMBER },
                                    nonOperationalExpenses: { type: Type.NUMBER },
                                    netResult: { type: Type.NUMBER }
                                },
                                required: ['totalRevenue', 'totalVariableCosts', 'contributionMargin', 'totalFixedCosts', 'operatingResult', 'nonOperationalIncome', 'nonOperationalExpenses', 'netResult']
                            },
                            kpis: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.STRING },
                                        interpretation: { type: Type.STRING }
                                    },
                                    required: ['name', 'value', 'interpretation']
                                }
                            },
                            tailoredAnalysis: { type: Type.STRING },
                            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
                            suggestedGoals: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['cashFlow', 'kpis', 'tailoredAnalysis', 'tips', 'suggestedGoals']
                    }
                }
            });
            const jsonStr = response.text.trim();
            return JSON.parse(jsonStr) as BusinessFinancialAnalysis;
        } catch (error) {
            console.error("Error generating business financial analysis:", error);
            throw new Error("Não foi possível gerar a análise de negócios.");
        }
    } else { // Personal analysis
        const prompt = `Com base nestas transações pessoais, gere uma análise financeira.

Transações: ${JSON.stringify(transactions)}

Responda APENAS com um objeto JSON. A análise deve incluir:
1.  'summary': Um resumo de uma frase sobre a saúde financeira.
2.  'totalIncome': A soma total de todas as transações de 'income' no período.
3.  'totalExpense': A soma total de todas as transações de 'expense' no período.
4.  'spendBySubCategory': Um array de objetos com 'label' (nome da subcategoria) e 'value' (soma total gasta), para TODAS as subcategorias de despesa com gastos no período. Se uma despesa não tiver subcategoria, use o nome da categoria principal como 'label'.
5.  'tips': Um array com 3 dicas práticas e acionáveis para melhorar a gestão financeira.
6.  'suggestedGoals': Um array com 3 metas financeiras claras e mensuráveis.
`;
        try {
            const response = await getAI().models.generateContent({
                model: "gemini-2.5-pro",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING },
                            totalIncome: { type: Type.NUMBER },
                            totalExpense: { type: Type.NUMBER },
                            spendBySubCategory: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        label: { type: Type.STRING },
                                        value: { type: Type.NUMBER }
                                    },
                                    required: ['label', 'value']
                                }
                            },
                            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
                            suggestedGoals: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['summary', 'totalIncome', 'totalExpense', 'spendBySubCategory', 'tips', 'suggestedGoals']
                    }
                }
            });

            const jsonStr = response.text.trim();
            return JSON.parse(jsonStr) as FinancialAnalysis;

        } catch (error) {
            console.error("Error generating financial analysis:", error);
            throw new Error("Não foi possível gerar a análise financeira.");
        }
    }
};


// Live API Audio utilities
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const createLiveSession = async (
    callbacks: {
        onMessage: (message: LiveServerMessage) => void;
        onError: (error: ErrorEvent) => void;
        onClose: (event: CloseEvent) => void;
        onOpen: () => void;
    }
): Promise<LiveSession> => {
    return getAI().live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: callbacks.onOpen,
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: SYSTEM_INSTRUCTION
        },
    });
};

export const createTranscriptionSession = async (
    callbacks: {
        onMessage: (message: LiveServerMessage) => void;
        onError: (error: ErrorEvent) => void;
        onClose: (event: CloseEvent) => void;
        onOpen: () => void;
    }
): Promise<LiveSession> => {
     return getAI().live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            inputAudioTranscription: {},
        },
    });
};

export function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}