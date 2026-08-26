export interface AnalyticsMetrics {
  dailyActiveScouts: number;
  dailyActiveRequesters: number;
  missionCompletionRate: number; // percentage 0-100
  verificationRate: number; // percentage 0-100
  avgCompletionTimeHours: number;
  avgResponseTimeMinutes: number;
  coinVelocity: number; // coins transacted per hour
  marketplaceLiquidityScore: number; // 0-100
}

export class AnalyticsEngine {
  private activeScoutIds: Set<string> = new Set();
  private activeRequesterIds: Set<string> = new Set();
  private totalMissions = 0;
  private completedMissions = 0;
  private totalVerifications = 0;
  private passedVerifications = 0;
  private completionTimesHours: number[] = [];
  private responseTimesMinutes: number[] = [];
  private totalCoinsTransacted = 0;
  private startTime: Date = new Date();

  public recordScoutActivity(scoutId: string): void {
    this.activeScoutIds.add(scoutId);
  }

  public recordRequesterActivity(requesterId: string): void {
    this.activeRequesterIds.add(requesterId);
  }

  public recordMissionCompleted(completionTimeHours: number, responseTimeMinutes: number): void {
    this.totalMissions += 1;
    this.completedMissions += 1;
    this.completionTimesHours.push(completionTimeHours);
    this.responseTimesMinutes.push(responseTimeMinutes);
  }

  public recordVerification(passed: boolean): void {
    this.totalVerifications += 1;
    if (passed) this.passedVerifications += 1;
  }

  public recordCoinTransaction(amount: number): void {
    this.totalCoinsTransacted += Math.abs(amount);
  }

  public computeMetrics(): AnalyticsMetrics {
    const hoursElapsed = Math.max(0.1, (Date.now() - this.startTime.getTime()) / (1000 * 3600));

    const avgCompletion =
      this.completionTimesHours.length > 0
        ? this.completionTimesHours.reduce((a, b) => a + b, 0) / this.completionTimesHours.length
        : 0;

    const avgResponse =
      this.responseTimesMinutes.length > 0
        ? this.responseTimesMinutes.reduce((a, b) => a + b, 0) / this.responseTimesMinutes.length
        : 0;

    const completionRate =
      this.totalMissions > 0 ? (this.completedMissions / this.totalMissions) * 100 : 100;
    const verificationRate =
      this.totalVerifications > 0
        ? (this.passedVerifications / this.totalVerifications) * 100
        : 100;
    const coinVelocity = Math.round(this.totalCoinsTransacted / hoursElapsed);

    return {
      dailyActiveScouts: this.activeScoutIds.size,
      dailyActiveRequesters: this.activeRequesterIds.size,
      missionCompletionRate: Number(completionRate.toFixed(1)),
      verificationRate: Number(verificationRate.toFixed(1)),
      avgCompletionTimeHours: Number(avgCompletion.toFixed(1)),
      avgResponseTimeMinutes: Number(avgResponse.toFixed(1)),
      coinVelocity,
      marketplaceLiquidityScore: Math.min(
        100,
        Math.round(this.activeScoutIds.size * 5 + coinVelocity / 100),
      ),
    };
  }
}
