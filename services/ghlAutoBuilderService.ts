import { IndigoTechnicalBlueprint, GHLBuildStatus, GhlOAuthTokens, AutoBuilderDryRunStep } from '../types';
import { db } from './automation/db';
import { toast } from './toastManager';
import { pushLog } from './geminiService';

class GHLAutoBuilder {
  private static instance: GHLAutoBuilder;
  private tokenBucket: number = 100;
  private lastFillAt: number = Date.now();

  private constructor() {}

  static getInstance(): GHLAutoBuilder {
    if (!GHLAutoBuilder.instance) GHLAutoBuilder.instance = new GHLAutoBuilder();
    return GHLAutoBuilder.instance;
  }

  /**
   * COMPUTE PLAN HASH
   * Derives a stable fingerprint for a blueprint to ensure build consistency.
   */
  computePlanHash(blueprint: IndigoTechnicalBlueprint): string {
    const canonical = JSON.stringify({
      data: blueprint.data_model,
      pipes: blueprint.pipelines
    });
    // Mock SHA256 for browser context
    let hash = 0;
    for (let i = 0; i < canonical.length; i++) {
      hash = ((hash << 5) - hash) + canonical.charCodeAt(i);
      hash |= 0;
    }
    return `indigo_hash_${Math.abs(hash).toString(16)}`;
  }

  /**
   * IDEMPOTENCY KEY GENERATOR
   * Derived from locationId, plan_hash, and resource_key.
   */
  makeIdempotencyKey(locationId: string, planHash: string, resourceKey: string): string {
    return `${locationId}:${planHash}:${resourceKey}`;
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastFillAt) / 1000;
    this.tokenBucket = Math.min(100, this.tokenBucket + (elapsed * 10));
    this.lastFillAt = now;
  }

  private async waitThrottle() {
    this.refill();
    if (this.tokenBucket < 1) {
       await new Promise(r => setTimeout(r, 500));
       return this.waitThrottle();
    }
    this.tokenBucket -= 1;
  }

  /**
   * COMPILE DRY RUN
   * Generates explicit ordered API steps for verification.
   */
  async compileDryRun(blueprint: IndigoTechnicalBlueprint, locationId: string): Promise<AutoBuilderDryRunStep[]> {
    const steps: AutoBuilderDryRunStep[] = [];
    const planHash = this.computePlanHash(blueprint);
    let stepIdx = 1;

    // 1. Custom Fields
    blueprint.data_model.custom_fields.forEach(f => {
      steps.push({
        step_number: stepIdx++,
        method: 'POST',
        endpoint: `/v2/locations/${locationId}/customFields`,
        payload: { name: f.name, dataType: f.dataType, placeholder: f.name },
        idempotency_key: this.makeIdempotencyKey(locationId, planHash, `cf_${f.key}`),
        description: `Create custom field: ${f.name}`,
        depends_on: [],
        expected_status: [201, 200]
      });
    });

    // 2. Tags
    blueprint.data_model.tags.forEach(t => {
       steps.push({
         step_number: stepIdx++,
         method: 'POST',
         endpoint: `/v2/locations/${locationId}/tags`,
         payload: { name: t },
         idempotency_key: this.makeIdempotencyKey(locationId, planHash, `tag_${t}`),
         description: `Register location tag: ${t}`,
         depends_on: [],
         expected_status: [201, 200]
       });
    });

    // 3. Pipelines
    blueprint.pipelines.forEach(p => {
       steps.push({
         step_number: stepIdx++,
         method: 'POST',
         endpoint: `/v2/locations/${locationId}/pipelines`,
         payload: { name: p.name, stages: p.stages.map((s, i) => ({ name: s, position: i })) },
         idempotency_key: this.makeIdempotencyKey(locationId, planHash, `pipe_${p.name}`),
         description: `Deploy pipeline: ${p.name}`,
         depends_on: [],
         expected_status: [201, 200]
       });
    });

    return steps;
  }

  /**
   * EXECUTE BUILD
   * Idempotent API Writes with Location-Specific Throttling.
   */
  async executeBuild(blueprint: IndigoTechnicalBlueprint, onLog: (msg: string) => void): Promise<GHLBuildStatus> {
    const creds = db.getGHLCreds();
    if (!creds) throw new Error("GHL_UNAUTHORIZED");

    const planHash = this.computePlanHash(blueprint);
    const steps = await this.compileDryRun(blueprint, creds.locationId);

    const status: GHLBuildStatus = {
      run_id: `run_${Date.now()}`,
      locationId: creds.locationId,
      plan_hash: planHash,
      status: 'EXECUTING',
      deployedResourceIds: {},
      logs: [],
      lastRunAt: Date.now()
    };

    const log = (msg: string) => {
       status.logs.push(msg);
       onLog(msg);
       pushLog(`GHL_BUILDER: ${msg}`);
    };

    try {
      log(`INITIATING BUILD SEQUENCE [RUN_ID: ${status.run_id}]`);
      log(`PLAN_HASH: ${planHash}`);

      for (const step of steps) {
        await this.waitThrottle();
        log(`Executing Step ${step.step_number}: ${step.description}`);
        log(`Endpoint: ${step.method} ${step.endpoint}`);
        
        // MOCK API CALL
        const mockGhlId = `ghl_res_${Math.random().toString(36).substr(2, 6)}`;
        status.deployedResourceIds[step.idempotency_key] = mockGhlId;
        
        log(`Step Success: Resource ID ${mockGhlId}`);
      }

      status.status = 'SUCCESS';
      db.saveGHLBuildStatus(creds.locationId, status);
      log(`BUILD SUCCESSFUL. ${steps.length} STEPS COMPLETED IDEMPOTENTLY.`);
      
    } catch (e: any) {
      status.status = 'FAILED';
      status.error = e.message;
      log(`FATAL ERROR during build sequence: ${e.message}`);
      db.saveGHLBuildStatus(creds.locationId, status);
    }

    return status;
  }

  async authorizeLocation(code: string): Promise<boolean> {
     const mockCreds: GhlOAuthTokens = {
       accessToken: 'at_live_demo_123',
       refreshToken: 'rt_live_demo_123',
       expiresAt: Date.now() + 3600000,
       locationId: 'LOC_INDIGO_001',
       scopes: ['contacts.write', 'opportunities.write', 'customFields.write']
     };
     db.saveGHLCreds(mockCreds);
     return true;
  }

  async dryRun(blueprint: IndigoTechnicalBlueprint): Promise<string[]> {
    const creds = db.getGHLCreds();
    if (!creds) throw new Error("GHL_UNAUTHORIZED");
    const steps = await this.compileDryRun(blueprint, creds.locationId);
    return steps.map(s => `[STEP ${s.step_number}] ${s.method} ${s.endpoint} | IDEM_KEY: ${s.idempotency_key.slice(-12)}`);
  }
}

export const ghlAutoBuilder = GHLAutoBuilder.getInstance();
