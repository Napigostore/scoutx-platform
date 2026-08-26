import type { MatchCandidate, MatchContext, MatchingEngine } from "@scoutx/matching-engine";

import { DiscoveryError } from "../errors/discovery-error.js";
import type {
  CandidateProvider,
  DiscoveryEngine,
  DiscoveryEvent,
  DiscoveryRequest,
  DiscoveryResult,
  FeedBuilder,
  PostProcessor,
  RecommendationProvider,
} from "../contracts/index.js";

export class DefaultDiscoveryEngine implements DiscoveryEngine {
  constructor(
    private readonly candidateProvider: CandidateProvider,
    private readonly matchingEngine: MatchingEngine,
    private readonly postProcessor?: PostProcessor,
    private readonly recommendationProvider?: RecommendationProvider,
    private readonly feedBuilder?: FeedBuilder,
  ) {}

  async execute(request: DiscoveryRequest): Promise<DiscoveryResult> {
    const requestCopy: DiscoveryRequest = {
      requesterId: request.requesterId,
      context: { ...request.context },
      candidates: request.candidates ? [...request.candidates] : undefined,
    };

    const events: DiscoveryEvent[] = [
      { type: "request_received", payload: { requesterId: requestCopy.requesterId } },
    ];

    try {
      this.validateRequest(requestCopy);
      events.push({ type: "request_validated" });

      const candidates = await this.candidateProvider.loadCandidates(requestCopy);
      events.push({ type: "candidates_loaded", payload: { count: candidates.length } });

      const context: MatchContext = {
        requesterId: requestCopy.requesterId,
        candidates: candidates as readonly MatchCandidate[],
      };

      const results = await this.matchingEngine.match(context);
      events.push({ type: "matching_completed", payload: { count: results.length } });

      const processed = this.postProcessor
        ? await this.postProcessor.process(requestCopy, results)
        : results;
      events.push({ type: "post_processed", payload: { count: processed.length } });

      if (this.recommendationProvider) {
        await this.recommendationProvider.getRecommendations(requestCopy);
        events.push({ type: "recommendations_loaded" });
      }

      if (this.feedBuilder) {
        const built = await this.feedBuilder.build({
          request: requestCopy,
          results: processed,
          events,
        });
        return built;
      }

      return {
        request: requestCopy,
        results: processed,
        events,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to process discovery request";
      throw new DiscoveryError(message);
    }
  }

  private validateRequest(request: DiscoveryRequest): void {
    if (!request.requesterId) {
      throw new DiscoveryError("requesterId is required");
    }
  }
}
