import { Elysia } from "elysia";
import validator from 'validator';
import { get_response } from "./services/get_response";
import { create_chat } from "./services/create_chat";
import cors from "@elysiajs/cors";

const PORT = process.env.PORT || process.env.port || 3000;
console.log('Process PORT:', process.env.PORT || process.env.port)

console.log('env:', process.env.NODE_ENV)

const app = new Elysia()
  .onAfterHandle(({ request, set }) => {
    // Only process CORS requests
    if (request.method !== "OPTIONS") return;

    const allowHeader = set.headers["Access-Control-Allow-Headers"];
    if (allowHeader === "*") {
      set.headers["Access-Control-Allow-Headers"] =
        request.headers.get("Access-Control-Request-Headers") ?? "";
    }
  })
  .use(cors())
  .post('/prompt', (resp) => {
    const prompt_payload = resp.body as { msg: string, chat_id: string };

    console.log('prompt payload:', prompt_payload);

    const msg = validator.escape(prompt_payload.msg || '');

    // Get prompt from gemini
    return get_response(msg, prompt_payload.chat_id);
  })
  .get('/chat', (req) => {
    req.set.headers['Access-Control-Allow-Origin'] = '*'
    return create_chat();
  })
  .listen({
    port: PORT,
    hostname: '0.0.0.0'
  });

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
