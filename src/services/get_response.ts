import { GeminiController } from "../controllers/GeminiController"

export const get_response = async (prompt: string, chat_id: string) => {
    return await GeminiController.get_response(prompt, chat_id);
}