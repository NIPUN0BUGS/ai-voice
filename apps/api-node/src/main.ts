import cors from "@fastify/cors";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { ProcessVoiceTurnUseCase } from "./application/use-cases/process-voice-turn.use-case";
import { ConversationDomainService } from "./domain/services/conversation-domain.service";
import { LocalMlInferenceClient } from "./infrastructure/model-clients/local-ml-inference.client";
import { VoiceSessionController } from "./presentation/http/controllers/voice-session.controller";

const port = Number(process.env.API_PORT ?? 4000);
const mlInferenceUrl = process.env.ML_INFERENCE_URL ?? "http://localhost:8000";

const server = Fastify({
  logger: true,
  bodyLimit: 8 * 1024 * 1024,
});

await server.register(cors, {
  origin: true,
});

const mlClient = new LocalMlInferenceClient(mlInferenceUrl);
const processVoiceTurn = new ProcessVoiceTurnUseCase(
  mlClient,
  mlClient,
  mlClient,
  new ConversationDomainService(),
);
const controller = new VoiceSessionController(processVoiceTurn);

server.get("/health", async () => ({
  status: "ok",
  service: "api-node",
}));

server.post("/voice-sessions", async (request, reply) => {
  const body = request.body as {
    userId?: string;
    language?: string;
    consentAccepted?: boolean;
  };

  if (!body?.userId?.trim()) {
    return reply.code(400).send({ message: "userId is required" });
  }

  if (body.consentAccepted !== true) {
    return reply.code(400).send({ message: "Recording consent is required" });
  }

  const now = Date.now();
  return {
    sessionId: randomUUID(),
    expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
  };
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

await server.listen({ port, host: "0.0.0.0" });
