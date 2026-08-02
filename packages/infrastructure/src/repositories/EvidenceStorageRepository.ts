import type { StorageProvider } from "@scoutx/storage";
import type { EvidenceRepository, EvidenceRecord, CreateEvidenceInput } from "./EvidenceRepository";

export class EvidenceStorageRepository implements EvidenceRepository {
  private readonly evidenceRepo: EvidenceRepository;
  private readonly storageProvider: StorageProvider;

  constructor(evidenceRepo: EvidenceRepository, storageProvider: StorageProvider) {
    this.evidenceRepo = evidenceRepo;
    this.storageProvider = storageProvider;
  }

  async create(input: CreateEvidenceInput): Promise<EvidenceRecord> {
    return this.evidenceRepo.create(input);
  }

  async findById(id: string): Promise<EvidenceRecord | null> {
    return this.evidenceRepo.findById(id);
  }

  async findByMissionId(missionId: string): Promise<readonly EvidenceRecord[]> {
    return this.evidenceRepo.findByMissionId(missionId);
  }

  async findByScoutId(scoutId: string): Promise<readonly EvidenceRecord[]> {
    return this.evidenceRepo.findByScoutId(scoutId);
  }

  async verify(id: string): Promise<boolean> {
    return this.evidenceRepo.verify(id);
  }

  async delete(id: string): Promise<boolean> {
    return this.evidenceRepo.delete(id);
  }

  async countByMissionId(missionId: string): Promise<number> {
    return this.evidenceRepo.countByMissionId(missionId);
  }

  async deleteStorage(storageKey: string): Promise<boolean> {
    return this.storageProvider.delete(storageKey);
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    return this.storageProvider.getDownloadUrl(storageKey);
  }

  async exists(storageKey: string): Promise<boolean> {
    return this.storageProvider.exists(storageKey);
  }
}
