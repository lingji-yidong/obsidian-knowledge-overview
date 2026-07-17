import { GenerationCancelledError } from "./chatCompletion";

export class LogicalRequestBudget {
  private usedRequests = 0;

  constructor(private readonly maxRequests: number) {}

  consume(): number {
    if (this.usedRequests >= this.maxRequests) {
      throw new Error(
        `Logical request budget exceeded (${this.maxRequests} requests)`,
      );
    }

    this.usedRequests += 1;
    return this.usedRequests;
  }

  get used(): number {
    return this.usedRequests;
  }

  get max(): number {
    return this.maxRequests;
  }
}

export class GenerationCancellation {
  private cancelled = false;

  cancel(): void {
    this.cancelled = true;
  }

  get isCancelled(): boolean {
    return this.cancelled;
  }

  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new GenerationCancelledError();
    }
  }
}
