const GEMINI_KEY = "your-gemini-key"; // ⚠️ Replace
const OPENAI_KEY = "your-openai-key"; // ⚠️ Replace

class AIBlock {
    constructor() {
        this.conversationHistory = [];
        this.currentModel = "gemini-1.5-flash"; // Default model
    }

    getInfo() {
        return {
            id: "AI",
            name: "AI",
            color1: "#800080", // Set block color to purple
            blocks: [
                {
                    opcode: "getText",
                    blockType: "reporter",
                    text: "get text [PROMPT] systemPrompt [SYSTEM_PROMPT] model [MODEL]",
                    arguments: {
                        PROMPT: {
                            type: "string",
                            defaultValue: "Ask me anything"
                        },
                        SYSTEM_PROMPT: {
                            type: "string",
                            defaultValue: "You are a highly intelligent and helpful assistant. Your goal is to provide accurate and informative responses to user queries. Always be polite, concise, and clear in your explanations."
                        },
                        MODEL: {
                            type: "string",
                            defaultValue: "gemini-1.5-flash"
                        }
                    }
                },
                {
                    opcode: "model",
                    blockType: "reporter",
                    text: "model",
                    arguments: {}
                },
                {
                    opcode: "resetMemory",
                    blockType: "command",
                    text: "reset memory"
                }
            ],
            menus: {
                providers: {
                    items: ["gemini", "openai"]
                },
                models: {
                    items: [
                        "gemini-1.5-flash",
                        "gemini-1.5-pro",
                        "gpt-3.5-turbo",
                        "gpt-4"
                    ]
                }
            }
        };
    }

    async getText({ PROMPT, SYSTEM_PROMPT, MODEL }) {
        const userPrompt = PROMPT.trim();
        const systemPrompt = SYSTEM_PROMPT.trim();
        const model = MODEL.trim();

        // Add to history
        this.conversationHistory.push({ role: "user", content: userPrompt });

        try {
            let response;
            if (model.startsWith("gemini")) {
                response = await this.handleGemini(model, systemPrompt);
            } else if (model.startsWith("gpt")) {
                response = await this.handleOpenAI(model, systemPrompt);
            } else {
                throw new Error("Invalid model");
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
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        
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
                "Authorization": `Bearer YOUR_OPENAI_KEY` // Replace with your OpenAI API key
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

    model() {
        return this.currentModel; // Return the current model
    }

    resetMemory() {
        this.conversationHistory = [];
    }
}

// Register the extension with Scratch
Scratch.extensions.register(new AIBlock());