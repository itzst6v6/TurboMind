const GEMINI_KEY = "your-gemini-key"; // ⚠️ Replace
const OPENAI_KEY = "your-openai-key"; // ⚠️ Replace

class AIBlock {
    constructor() {
        this.conversationHistory = [];
    }

    getInfo() {
        return {
            "id": "AI",
            "name": "AI",
            "color1": "#800080", // Set block color to purple
            "blocks": [
                {
                    "opcode": "getText",
                    "blockType": "reporter",
                    "text": "get text [PROMPT] systemPrompt [SYSTEM_PROMPT] provider [PROVIDER] model [MODEL]",
                    "arguments": {
                        "PROMPT": {
                            "type": "string",
                            "defaultValue": "Hello"
                        },
                        "SYSTEM_PROMPT": {
                            "type": "string",
                            "defaultValue": "You are a highly intelligent and helpful assistant. Your goal is to provide accurate and informative responses to user queries. Always be polite, concise, and clear in your explanations."
                        },
                        "PROVIDER": {
                            "type": "string",
                            "menu": "providers",
                            "defaultValue": "gemini"
                        },
                        "MODEL": {
                            "type": "string",
                            "menu": "models",
                            "defaultValue": "gemini-1.5-flash"
                        }
                    }
                },
                {
                    "opcode": "resetMemory",
                    "blockType": "command",
                    "text": "reset memory"
                }
            ],
            "menus": {
                "providers": {
                    "items": ["gemini", "openai"]
                },
                "models": {
                    "items": [
                        "gemini-1.5-flash",
                        "gemini-1.5-pro",
                        "gpt-3.5-turbo",
                        "gpt-4"
                    ],
                    "acceptReporters": true
                }
            }
        };
    }

    async getText({ PROMPT, SYSTEM_PROMPT, PROVIDER, MODEL }) {
        const userPrompt = PROMPT.trim();
        const systemPrompt = SYSTEM_PROMPT.trim();
        const provider = PROVIDER.trim().toLowerCase();
        const model = MODEL.trim();

        // Add to history
        this.conversationHistory.push({ role: "user", content: userPrompt });

        try {
            let response;
            if (provider === "gemini") {
                response = await this.handleGemini(model, systemPrompt);
            } else if (provider === "openai") {
                response = await this.handleOpenAI(model, systemPrompt);
            } else {
                throw new Error("Invalid provider");
            }

            // Store AI response
            this.conversationHistory.push({ role: "assistant", content: response });
            return response;

        } catch (error) {
            console.error("Error:", error);
            return "API Error";
        }
    }

    async handleGemini(model, systemPrompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: this.conversationHistory.map(msg => ({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.content }]
                }))
            })
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    }

    async handleOpenAI(model, systemPrompt) {
        const url = "https://api.openai.com/v1/chat/completions";
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...this.conversationHistory
                ]
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response";
    }

    resetMemory() {
        this.conversationHistory = [];
    }
}

Scratch.extensions.register(new AIBlock());