import crypto from 'crypto';
import emojiStrip from 'emoji-strip';
import { markdownToTxt } from 'markdown-to-txt';

import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} from "@google/generative-ai";

class GeminiControllerSingleton {
    private gemini: GoogleGenerativeAI;
    private textModel;
    private visionModel;
    private chats = new Map<string, any>();

    constructor() {
        this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
        this.textModel = this.gemini.getGenerativeModel({
            model: "gemini-1.5-pro-latest",
            systemInstruction: "You are a companion who is curious, quick-witted, and up-to-date with current world events, always ready to assist and learn. Pretend that we are talking verbally.",
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 8192,
                responseMimeType: "text/plain",
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
                },
            ],
        });
        this.visionModel = this.gemini.getGenerativeModel({
            model: 'gemini-pro-vision', generationConfig: {
                temperature: 0,
            },
        });

        this.chats = new Map();
    }

    async create_chat() {
        const chat = await this.textModel.startChat({
            history: [
                // {
                //     role: 'user',
                //     parts: [
                //         {
                //             text: 'You are a curious and quick-witted companion, always ready to assist and learn alongside me.'
                //         }
                //     ],
                // },
                // {
                //     role: 'model',
                //     parts: [
                //         {
                //             text: "Ah, a fellow explorer of the unknown! I'm delighted to join you on this journey. Ask away, and let's see what wonders we can uncover together!"
                //         }
                //     ],
                // },
            ]
        });

        const chat_id = crypto.randomUUID();

        this.chats.set(chat_id, {
            chat,
            last_used: Date.now(),
        });

        const response = /* JSON.stringify */({
            chat_id
        });

        console.log('Create chat:', response);

        return response;
    }

    async get_response(prompt: string, chat_id: string) {
        let return_val: any = {
            text: 'I have nothing to say? Hmm, strange, try again please.',
        };

        try {
            if (!this.chats.has(chat_id)) {
                return_val = {
                    error: true,
                    text: 'Chat session dead',
                };
            } else {
                console.log('getting here')

                const chat_data = this.chats.get(chat_id);

                const chat = chat_data.chat;
                chat_data.last_used = Date.now();

                const result = await chat.sendMessage(prompt);

                const response = await result.response;

                const text = response.text();

                // console.log('res:', response);
                console.log('res text:', text);

                return_val = {
                    text: markdownToTxt(emojiStrip(text)).replace(/\*/gi, ''),
                };
            }
        } catch (err) {
            console.log('error:', err)
        }

        return return_val;
    }

    clean_chats() {
        const now = Date.now();

        const time_elapsed = 5 * 60 * 1000;

        this.chats.forEach((val, key) => {
            if (now - val.last_used > time_elapsed) {
                this.chats.delete(key);
            }
        })
    }
}

export const GeminiController = new GeminiControllerSingleton();

setInterval(() => {
    GeminiController.clean_chats()
}, 5 * 60 * 1000);