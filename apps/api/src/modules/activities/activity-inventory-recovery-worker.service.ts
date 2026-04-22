import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { ActivityInventoryRecoveryService } from "./activity-inventory-recovery.service";

const REHYDRATE_INTERVAL_MS = 60_000;

@Injectable()
export class ActivityInventoryRecoveryWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ActivityInventoryRecoveryWorkerService.name);
  private rehydrateTimer?: NodeJS.Timeout;

  constructor(
    private readonly activityInventoryRecoveryService: ActivityInventoryRecoveryService
  ) {}

  async onModuleInit() {
    const rehydrated = await this.activityInventoryRecoveryService.rehydrateActiveTickets();
    this.logger.log(`Rehydrated ${rehydrated} activity inventory snapshots`);

    this.rehydrateTimer = setInterval(() => {
      void this.activityInventoryRecoveryService
        .rehydrateActiveTickets()
        .catch((error) => {
          this.logger.warn(
            `Failed to rehydrate activity inventory: ${
              error instanceof Error ? error.message : "unknown-error"
            }`
          );
        });
    }, REHYDRATE_INTERVAL_MS);
  }

  async onModuleDestroy() {
    if (this.rehydrateTimer) {
      clearInterval(this.rehydrateTimer);
    }
  }
}
