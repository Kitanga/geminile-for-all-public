import { GeminiController } from "../controllers/GeminiController"

export const create_chat = async () => {
    return await GeminiController.create_chat();
}