export interface VirusScanResult {
  readonly infected: boolean;
  readonly threatName: string | null;
}

export interface VirusScanner {
  scan(buffer: Buffer, fileName: string): Promise<VirusScanResult>;
}
