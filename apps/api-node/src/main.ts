import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { ProcessVoiceTurnUseCase } from "./application/use-cases/process-voice-turn.use-case.js";
import { StartVoiceSessionUseCase } from "./application/use-cases/start-voice-session.use-case.js";
import { ConversationDomainService } from "./domain/services/conversation-domain.service.js";
import { LocalMlInferenceClient } from "./infrastructure/model-clients/local-ml-inference.client.js";
import { InMemoryVoiceSessionRepository } from "./infrastructure/persistence/in-memory-voice-session.repository.js";
import { VoiceSessionController } from "./presentation/http/controllers/voice-session.controller.js";

const port = Number(process.env.API_PORT ?? 4000);
const mlInferenceUrl = process.env.ML_INFERENCE_URL ?? "http://localhost:8000";

const server = Fastify({
  logger: true,
  bodyLimit: 8 * 1024 * 1024,
});

await server.register(cors, {
  origin: true,
});
await server.register(websocket);

const mlClient = new LocalMlInferenceClient(mlInferenceUrl);
const sessionRepository = new InMemoryVoiceSessionRepository();
const startVoiceSession = new StartVoiceSessionUseCase(sessionRepository);
const processVoiceTurn = new ProcessVoiceTurnUseCase(
  mlClient,
  mlClient,
  mlClient,
  new ConversationDomainService(),
  sessionRepository,
);
const controller = new VoiceSessionController(processVoiceTurn);

server.get("/health", async () => ({
  status: "ok",
  service: "api-node",
}));

server.post("/voice-sessions", async (request, reply) => {
  try {
    return await startVoiceSession.execute(request.body as never);
  } catch (error) {
    request.log.warn(error);
    return reply.code(400).send({
      message:
        error instanceof Error ? error.message : "Invalid voice session request",
    });
  }
});

server.post("/voice-turns", async (request, reply) => {
  try {
    return await controller.processTurn(request.body);
  } catch (error) {
    request.log.error(error);
    return reply.code(400).send({
      message: error instanceof Error ? error.message : "Invalid voice turn",
    });
  }
});

server.register(async (socketServer) => {
  socketServer.get("/voice-sessions/:sessionId/stream", { websocket: true }, (socket) => {
    socket.on("message", async (rawMessage: Buffer) => {
      try {
        const payload = JSON.parse(rawMessage.toString()) as Record<string, unknown>;
        const result = await controller.processTurn(payload);
        socket.send(JSON.stringify({ type: "voice-turn", payload: result }));
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: "error",
            message:
              error instanceof Error ? error.message : "Invalid voice stream message",
          }),
        );
      }
    });
  });
});

await server.listen({ port, host: "0.0.0.0" });
