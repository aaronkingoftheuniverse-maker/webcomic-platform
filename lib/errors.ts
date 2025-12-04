export class CreatorProfileNotFoundError extends Error {
  constructor(message = "Creator profile not found for the given user.") {
    super(message);
    this.name = "CreatorProfileNotFoundError";
  }
}