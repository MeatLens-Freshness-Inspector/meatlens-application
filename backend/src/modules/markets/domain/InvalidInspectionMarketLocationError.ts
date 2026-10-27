export class InvalidInspectionMarketLocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInspectionMarketLocationError";
  }
}
