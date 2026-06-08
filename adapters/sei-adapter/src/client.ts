import { Config } from "./config";

export class ChainClient {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  getConfig(): Config {
    return this.config;
  }
}
