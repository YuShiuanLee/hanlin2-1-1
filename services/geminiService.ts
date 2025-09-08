import { GoogleGenAI, Type } from "@google/genai";
import { Quiz1Question, Quiz2Question, Quiz3Question, ImageStyle, LearningCard, CustomContent } from '../types';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY is not configured in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

const simpleSentencePromptInjection = `
重要規則：這份教材是給國小資源班程度較弱的學生使用的，例句品質至關重要。
1.  **結構要求**：每個例句都必須由「最少三個、最多四個短句」組成。請使用「逗號」來分隔子句，並以「句號或驚嘆號」結尾。
2.  **內容要求**：句子必須「生活化」、「具體」、用詞「簡單」。
3.  **長度**：請嚴格遵守三到四個子句的結構，不要寫得過長或過短。

**黃金標準範例 (必須嚴格模仿此結構與風格):**
*   詞彙：**如釋重負** -> 「小麗寫了很久的作業，終於全部寫完了，心裡感到如釋重負。」
*   詞彙：**得不償失** -> 「叔叔為了賺很多錢，失去了和家人吃飯和聊天的時間，真的是得不償失。」
*   詞彙：**荒謬絕倫** -> 「有一隻貓咪竟然穿著西裝坐在辦公室裡寫東西，最荒謬絕倫的是，牠的桌上還放了一整條魚！」
`;

export async function parseStructuredVocabularyInput(text: string): Promise<LearningCard[] | null> {
    const ai = getAiClient();

    const prompt = `請你扮演一位國小資源班老師的助理。請分析以下文本，該文本可能包含一個結構化的詞彙列表，其中每個詞彙都有定義和例句（可能以「造句」標示）。
    你的任務是：
    1. 提取每個詞彙、其定義和其例句。
    2. 為每個詞彙生成「個別字義拆解」（charDefinitions）。請將詞彙拆解成最核心、有意義的字或詞組，並提供最簡單、最淺顯的解釋。例如，「如釋重負」可拆解為「如: 好像」、「釋: 放下」、「重: 沉重的」、「負: 負擔」；而「荒謬絕倫」則最好拆解為「荒謬: 荒唐且錯誤的」、「絕倫: 沒有其它事物可以相比的」。請根據詞彙的結構做最合適的拆解。
    3. 檢查每個詞彙提取到的例句數量。如果例句少於3個，請你根據詞彙和其定義，額外生成足夠的例句，使總數達到3個。請務必保留用戶原本提供的例句。
    4. ${simpleSentencePromptInjection}
    5. 將所有資訊整理成 JSON 格式。回傳的 JSON 物件必須包含一個名為 "cards" 的鍵，其值為一個 LearningCard 物件陣列。
    6. 請盡力分析文本。即使某些詞彙條目不完整（例如，缺少例句或定義），也請處理你能夠成功解析的條目。只有在完全無法從文本中識別出任何結構化詞彙條目的情況下，才在回傳的 JSON 中讓 "cards" 的值為一個空陣列 []。

    文本內容：
    ---
    ${text}
    ---`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    cards: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                charDefinitions: {
                                    type: Type.ARRAY,
                                    description: "詞彙中每個字或詞組的個別解釋",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            char: { type: Type.STRING },
                                            definition: { type: Type.STRING }
                                        },
                                        required: ['char', 'definition']
                                    }
                                },
                                definition: { type: Type.STRING },
                                sentences: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                }
                            },
                            required: ['word', 'charDefinitions', 'definition', 'sentences']
                        }
                    }
                },
                required: ['cards']
            },
        },
    });

    const jsonResponse = JSON.parse(response.text);

    if (!jsonResponse.cards || !Array.isArray(jsonResponse.cards)) {
        console.error("Invalid API response format for structured parsing:", jsonResponse);
        return null;
    }

    if (jsonResponse.cards.length === 0) {
        return null; // Return null to indicate fallback is needed
    }

    return jsonResponse.cards;
}

export async function extractWordsFromText(text: string): Promise<string[]> {
    const ai = getAiClient();

    const prompt = `請你扮演一位國小資源班老師。請從以下文本中，提取出適合國小高年級學生學習的中文詞彙或成語 (通常為4個字以上)。請以 JSON 格式回傳，其中包含一個名為 "words" 的鍵，其值為一個包含所有提取到的詞彙的字串陣列。如果文本中沒有找到合適的詞彙，請回傳一個空陣列。
    文本內容：
    ---
    ${text}
    ---`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    words: {
                        type: Type.ARRAY,
                        description: "從文本中提取出的詞彙或成語列表",
                        items: { type: Type.STRING }
                    }
                },
                required: ['words']
            },
        },
    });

    const jsonResponse = JSON.parse(response.text);

    if (!jsonResponse.words || !Array.isArray(jsonResponse.words)) {
        console.error("Invalid API response format for word extraction:", jsonResponse);
        return [];
    }
    
    return jsonResponse.words;
}


export async function generateDefinitionQuiz(words: string[], learningData?: LearningCard[]): Promise<Quiz1Question[]> {
  const ai = getAiClient();

  const contextPrompt = learningData && learningData.length > 0
    ? `請優先使用這份學習資料來產生題目（尤其是定義）：\n${JSON.stringify(learningData)}`
    : '';

  const prompt = `請你扮演一位國小資源班老師。針對這份詞彙列表：「${words.join('、')}」，為每個詞彙設計一個「語詞解釋配對選擇」問題。
${contextPrompt}
每個問題包含：
1. 一個簡單、生活化、符合學生程度的詞彙解釋。如果前面有提供學習資料，請直接使用該資料中的定義。
2. 四個選項，其中一個是正確的詞彙，另外三個是從「相同詞彙列表」中選出的干擾項。
請確保解釋和選項都非常簡單易懂，且選項必須包含正確答案。`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING, description: "正確的詞彙" },
                definition: { type: Type.STRING, description: "該詞彙的解釋" },
                options: {
                  type: Type.ARRAY,
                  description: "包含一個正確答案和三個干擾項的四個選項，選項必須來自提供的詞彙列表。",
                  items: { type: Type.STRING }
                }
              },
              required: ['word', 'definition', 'options']
            },
          },
        },
        required: ['questions']
      },
    },
  });

  const jsonResponse = JSON.parse(response.text);

  if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
    throw new Error("無效的 API 回應格式 (Definitions)");
  }

  return jsonResponse.questions.map((q: Quiz1Question) => ({
      ...q,
      options: shuffleArray(q.options)
  }));
}

export async function generateSentenceQuiz(words: string[], learningData?: LearningCard[]): Promise<Quiz2Question[]> {
  const ai = getAiClient();

  const contextPrompt = learningData && learningData.length > 0
    ? `請優先使用這份學習資料來產生題目（尤其是例句）：\n${JSON.stringify(learningData)}`
    : '';

  const prompt = `請你扮演一位國小資源班老師。針對這份詞彙列表：「${words.join('、')}」，為每個詞彙設計一個「語詞例句漏空選擇」問題。
${contextPrompt}
每個問題包含：
1. 一個例句，其中目標詞彙用 '____' 代替。
2. 一個在括號內的句子提示，解釋整個句子的意思。
3. 四個選項，其中一個是正確的詞彙，另外三個是從「相同詞彙列表」中選出的干擾項。
${simpleSentencePromptInjection}
請確保例句、提示和選項都非常簡單易懂，且選項必須包含正確答案。`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING, description: "正確的詞彙" },
                sentence: { type: Type.STRING, description: "包含 '____' 和提示的完整句子" },
                options: {
                  type: Type.ARRAY,
                  description: "包含一個正確答案和三個干擾項的四個選項，選項必須來自提供的詞彙列表。",
                  items: { type: Type.STRING }
                }
              },
              required: ['word', 'sentence', 'options']
            },
          },
        },
        required: ['questions']
      },
    },
  });

  const jsonResponse = JSON.parse(response.text);

  if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
    throw new Error("無效的 API 回應格式");
  }

  return jsonResponse.questions.map((q: Quiz2Question) => ({
      ...q,
      options: shuffleArray(q.options)
  }));
}

export async function generateConceptQuiz(words: string[], learningData?: LearningCard[]): Promise<Quiz3Question[]> {
  const ai = getAiClient();

  const contextPrompt = learningData && learningData.length > 0
    ? `請優先使用這份學習資料來產生題目（尤其是定義和例句，可用來發想情境）：\n${JSON.stringify(learningData)}`
    : '';

  const prompt = `請你扮演一位國小資源班老師。針對這份詞彙列表：「${words.join('、')}」，為每個詞彙設計一個「語詞概念匹配測驗」問題。
${contextPrompt}
每個問題包含：
1. 一個描述詞彙概念的「情境」，情境中不能直接出現目標詞彙。
2. 一個在括號內的「提示」，解釋情境所表達的概念。
3. 四個選項，其中一個是正確的詞彙，另外三個是從「相同詞彙列表」中選出的干擾項。
${simpleSentencePromptInjection.replace('例句', '情境')}
請確保情境、提示和選項都非常簡單、生活化，且選項必須包含正確答案。`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING, description: "正確的詞彙" },
                scenario: { type: Type.STRING, description: "描述情境和提示的完整文字" },
                options: {
                  type: Type.ARRAY,
                  description: "包含一個正確答案和三個干擾項的四個選項，選項必須來自提供的詞彙列表。",
                  items: { type: Type.STRING }
                }
              },
              required: ['word', 'scenario', 'options']
            },
          },
        },
        required: ['questions']
      },
    },
  });

  const jsonResponse = JSON.parse(response.text);

  if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
    throw new Error("無效的 API 回應格式 (Scenarios)");
  }

  return jsonResponse.questions.map((q: Quiz3Question) => ({
      ...q,
      options: shuffleArray(q.options)
  }));
}


export async function generateLearningCards(
    words: string[],
    customContent?: Record<string, CustomContent>
): Promise<LearningCard[]> {
    const ai = getAiClient();

    const vocabularyData = words.map(word => {
        const custom = customContent?.[word];
        return custom ? { word, "pre-existing_sentence": custom.sentence } : { word };
    });

    const prompt = `請你扮演一位國小資源班老師。為以下每個中文詞彙，生成學習卡片內容。

    **詞彙與資料:**
    ${JSON.stringify(vocabularyData, null, 2)}

    **任務指示:**
    為列表中的每一個詞彙物件生成一張學習卡片。每張卡片包含：
    1.  **個別字義拆解**: 將每個詞彙拆解成最核心、有意義的字或詞組，並提供最簡單、最淺顯的解釋。例如，「如釋重負」可拆解為「如: 好像」、「釋: 放下」；而「荒謬絕倫」則最好拆解為「荒謬: 荒唐且錯誤的」、「絕倫: 沒有其它事物可以相比的」。
    2.  **整合解釋**: 一個整合起來、適合國小低年級學生的簡單詞彙解釋。
    3.  **例句 (總共三個)**:
        - 如果該詞彙在資料中有提供 "pre-existing_sentence"，你 **必須** 將該句子作為 **第一個** 例句。然後，你再額外生成 **兩個** 不同的新例句。
        - 如果該詞彙 **沒有** 提供 "pre-existing_sentence"，你就必須自行生成 **三個** 新的例句。
        - 所有你生成的例句都必須遵守以下黃金準則：
        ${simpleSentencePromptInjection}

    請確保最終每個詞彙的 "sentences" 陣列中都恰好包含三個例句。`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    cards: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                charDefinitions: {
                                    type: Type.ARRAY,
                                    description: "詞彙中每個字或詞組的個別解釋",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            char: { type: Type.STRING, description: "字或詞組" },
                                            definition: { type: Type.STRING, description: "對應的解釋" }
                                        },
                                        required: ['char', 'definition']
                                    }
                                },
                                definition: { type: Type.STRING },
                                sentences: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                }
                            },
                            required: ['word', 'charDefinitions', 'definition', 'sentences']
                        }
                    }
                },
                required: ['cards']
            },
        },
    });

    const jsonResponse = JSON.parse(response.text);

    if (!jsonResponse.cards || !Array.isArray(jsonResponse.cards)) {
        throw new Error("無效的 API 回應格式 (Learning Cards)");
    }
    
    return jsonResponse.cards;
}

export async function generateImageForPrompt(prompt: string, style: ImageStyle): Promise<string> {
    const ai = getAiClient();

    const enhancedPrompt = `為一張給兒童看的學習卡片，畫一張插圖。插圖主題是：「${prompt}」，風格為「${style}」。插圖要色彩鮮豔，線條簡單，容易理解。`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: enhancedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("無法生成圖片");
    }

    return response.generatedImages[0].image.imageBytes;
}

export async function generateVoiceMaterial(characters: string): Promise<string> {
    const ai = getAiClient();
    
    const characterList = characters.replace(/[\s,，、\n]+/g, '').split('');
    if (characterList.length === 0) {
        return "請提供生字列表。";
    }

    const prompt = `你是一位專業的特殊教育教材製作者。請根據我提供的生字列表，為每一個生字生成一行符合特定格式的教材內容。

    **格式要求**
    每一行的格式必須嚴格遵守：\`^生字#語詞@語詞的生字,生字#語詞@語詞\`
    - 以 \`^\` 開頭。
    - 使用 \`#\`, \`@\`, \`,\` 作為分隔符號。
    - 範例：如果生字是「爽」，語詞是「涼爽」，那麼輸出的行就是 \`^爽#涼爽@涼爽的爽,爽#涼爽@涼爽\`

    **內容要求**
    1.  **語詞選擇**: 為每個生字搭配一個最生活化、最具體、最簡單的語詞。這份教材是給國小特殊教育學生使用的。
        - **重要原則範例**:
            - 「舟」 -> 選擇「獨木舟」(比「小舟」更常用)。
            - 「載」 -> 選擇「載貨」(比「裝載」更簡單)。
            - 「讓」 -> 選擇「讓座」(非常生活化)。
            - 「訣」 -> 選擇「口訣」(學生熟悉)。
    2.  **完整性**: 我提供多少個生字，你就必須生成多少行內容，一個都不能少。
    3.  **獨特性**: 盡量為每個生字選擇不同的語詞。
    4.  **相關性**: 語詞中必須包含該生字。

    **生字列表如下：**
    ${characterList.join('')}

    請直接開始輸出內容，不要包含任何前言、標題或結語。`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    let resultText = response.text.trim();
    if (resultText.startsWith('```') && resultText.endsWith('```')) {
        resultText = resultText.substring(3, resultText.length - 3).trim();
    }
    
    return resultText;
}

export async function generateVoiceWordMaterial(text: string): Promise<string> {
    const ai = getAiClient();
    const wordList = text.split(/[\s,，、\n]+/).filter(w => w.length > 0);

    if (wordList.length === 0) {
        return "請提供語詞列表。";
    }

    const prompt = `你是一位為國小特殊教育學生設計教材的專家。請根據我提供的語詞列表，生成一份包含三個部分的教材內容。

    **語詞列表：**
    ${wordList.join('、')}

    ---

    **第一部分：結構化教材**

    請為列表中的**每一個語詞**生成一行內容，並嚴格遵守以下格式：
    \`語詞#搜圖的關鍵字@包含語詞的例句,語詞#搜圖的關鍵字@語詞：語詞的解釋\`

    **內容規則：**
    1.  **例句**: 必須簡單、生活化，且一定要包含該語詞。
    2.  **解釋**: 必須用非常白話、易懂的方式解釋語詞的意思。
    3.  **搜圖的關鍵字**: 內容盡量和例句情境相符，以幫助搜尋到匹配的圖片。
    4.  **完整性**: 提供多少語詞，就要生成多少行，一行都不能少。

    **範例：**
    -   輸入: "傾盆大雨"
    -   輸出: \`傾盆大雨#傾盆大雨街道都積水@外面下傾盆大雨，街道都積水了。,傾盆大雨#傾盆大雨街道都積水@傾盆大雨：雨下得非常大。\`

    ---

    **第二部分：例句列表**

    在第一部分內容的**正下方**，請另起新段落，生成一個數字編號的列表。每一項都必須是你在第一部分中為每個語詞創建的例句，並遵循 \`數字.語詞：例句\` 的格式。

    **範例 (接續上面的例子)：**
    \`\`\`
    1.傾盆大雨：外面下傾盆大雨，街道都積水了。
    2.充滿：教室裡充滿歡樂的笑聲。
    \`\`\`

    ---

    **第三部分：語詞清單**

    在第二部分內容的**正下方**，請另起新段落，只列出所有提供的語詞，每個語詞佔一行。

    **範例 (接續上面的例子)：**
    \`\`\`
    傾盆大雨
    充滿
    \`\`\`

    ---

    請嚴格按照「第一部分」緊接著「第二部分」再緊接著「第三部分」的順序輸出，每個部分之間用三個連字號 (---) 分隔。不要添加任何額外的前言或結語。`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    let resultText = response.text.trim();
    if (resultText.startsWith('```') && resultText.endsWith('```')) {
        resultText = resultText.substring(3, resultText.length - 3).trim();
    }
    
    return resultText.replace(/---/g, '\n\n');
}

export async function generateVoiceWordMaterial2(text: string): Promise<string> {
    const ai = getAiClient();
    const wordList = text.split(/[\s,，、\n]+/).filter(w => w.length > 0);

    if (wordList.length === 0) {
        return "請提供語詞列表。";
    }

    const prompt = `你是一位為國小特殊教育學生設計教材的專家。請根據我提供的語詞列表，生成一份包含三個部分的教材內容。

    **語詞列表：**
    ${wordList.join('、')}

    ---

    **第一部分：結構化教材**

    請為列表中的**每一個語詞**生成一行內容，並嚴格遵守以下格式：
    \`語詞名稱#語詞名稱@語詞例句,語詞名稱#語詞名稱@語詞名稱:語詞解釋\`

    **內容規則：**
    1.  **例句與解釋**: 必須非常具體、簡單、生活化，適合特殊教育學生學習。
    2.  **完整性**: 我提供多少個語詞，你就必須生成多少行內容，一個都不能少。
    3.  **格式嚴格**: 每一行的結構必須與我提供的範例完全一致。

    **範例：**
    -   輸入: "皺巴巴"
    -   輸出: \`皺巴巴#皺巴巴@大象的皮膚皺巴巴的。,皺巴巴#皺巴巴@皺巴巴:皺紋很多的樣子。\`

    ---

    **第二部分：例句列表**

    在第一部分內容的**正下方**，請另起新段落，生成一個數字編號的列表。每一項都必須是你在第一部分中為每個語詞創建的例句，並遵循 \`數字.語詞：例句\` 的格式。

    **範例 (接續上面的例子)：**
    \`\`\`
    1.皺巴巴：大象的皮膚皺巴巴的。
    2.搖晃：母親搖晃嬰兒會對嬰兒造成很大的傷害。
    \`\`\`

    ---

    **第三部分：語詞清單**

    在第二部分內容的**正下方**，請另起新段落，只列出所有提供的語詞，每個語詞佔一行。

    **範例 (接續上面的例子)：**
    \`\`\`
    皺巴巴
    搖晃
    \`\`\`

    ---

    請嚴格按照「第一部分」緊接著「第二部分」再緊接著「第三部分」的順序輸出，每個部分之間用三個連字號 (---) 分隔。不要添加任何額外的前言或結語。`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    let resultText = response.text.trim();
    if (resultText.startsWith('```') && resultText.endsWith('```')) {
        resultText = resultText.substring(3, resultText.length - 3).trim();
    }
    
    return resultText.replace(/---/g, '\n\n');
}

export async function matchSentencesToWords(words: string[], sentencesText: string): Promise<Record<string, string>> {
    if (!sentencesText.trim()) {
        return {};
    }
    const ai = getAiClient();
    const prompt = `You are an expert linguistic assistant. Your task is to match a list of vocabulary words to their corresponding example sentences from a given block of text.

    **Vocabulary Words to match:**
    ${words.join(', ')}

    **Text containing various sentences:**
    ---
    ${sentencesText}
    ---

    **Instructions:**
    1.  Read each vocabulary word from the list.
    2.  Find the single sentence in the text that best illustrates the meaning of that specific word. The sentence **must contain the word**.
    3.  Create a JSON object that maps each vocabulary word **from the provided list** to its corresponding sentence.
    4.  If you cannot find a clear, matching sentence for a word from the list, you must omit that word from the final JSON object.
    5.  The output must be only the JSON object, containing a single key "matches" which is an array of objects.

    **Example:**
    - Words: ["如釋重負", "得不償失", "心照不宣"]
    - Text: "考完試後，我感到如釋重負，終於可以好好玩了。為了省一點點錢，卻花了很多時間和力氣，真是得不償失。"
    - Expected JSON Output:
      {
        "matches": [
          { "word": "如釋重負", "sentence": "考完試後，我感到如釋重負，終於可以好好玩了。" },
          { "word": "得不償失", "sentence": "為了省一點點錢，卻花了很多時間和力氣，真是得不償失。" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    matches: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                sentence: { type: Type.STRING }
                            },
                            required: ['word', 'sentence']
                        }
                    }
                },
                required: ['matches']
            },
        },
    });

    const jsonResponse = JSON.parse(response.text);
    
    if (!jsonResponse.matches || !Array.isArray(jsonResponse.matches)) {
        console.error("Invalid API response format for sentence matching:", jsonResponse);
        return {};
    }
    
    const resultMap: Record<string, string> = {};
    for (const match of jsonResponse.matches) {
        if (words.includes(match.word)) {
            resultMap[match.word] = match.sentence;
        }
    }
    
    return resultMap;
}

export async function generateSentenceForImage(word: string, imageBase64: string, mimeType: string): Promise<string> {
    const ai = getAiClient();
    const prompt = `這是一張關於「${word}」這個詞彙的圖片。請你扮演一位國小資源班老師。
    任務：根據圖片內容，生成一個符合圖片情境、並且使用到「${word}」的例句。
    ${simpleSentencePromptInjection}
    請直接回傳一句例句，不要有任何其他文字。`;

    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: prompt,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text.trim();
}