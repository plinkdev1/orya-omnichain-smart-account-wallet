import { PassportReader } from '@gitcoinco/passport-sdk-reader';
import type { PassportStamp, PassportScore, StampInfo } from './types';

export class HumanPassportClient {
  private reader: PassportReader;
  private scorerApiKey: string;
  private scorerId: string;
  private readonly GITCOIN_API_URL = 'https://api.scorer.gitcoin.co';

  constructor() {
    this.scorerApiKey = process.env.NEXT_PUBLIC_GITCOIN_SCORER_API_KEY || '';
    this.scorerId = process.env.NEXT_PUBLIC_GITCOIN_SCORER_ID || '';
    this.reader = new PassportReader();

    if (!this.scorerApiKey || !this.scorerId) {
      console.warn('⚠️  Gitcoin Passport credentials not configured');
    }
  }

  async getPassport(address: string, chainId: number = 1): Promise<PassportStamp[]> {
    try {
      const stamps = await this.reader.getPassport(address, chainId);
      return stamps || [];
    } catch (error) {
      console.error('Failed to fetch passport:', error);
      return [];
    }
  }

  async getScore(address: string): Promise<PassportScore> {
    try {
      const response = await fetch(
        `${this.GITCOIN_API_URL}/registry/score/${this.scorerId}/${address}`,
        {
          headers: {
            'X-API-Key': this.scorerApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            address,
            score: 0,
            status: 'DONE',
            last_score_timestamp: new Date().toISOString(),
            stamps: [],
            evidence: undefined,
          };
        }
        throw new Error(`Failed to fetch score: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching score:', error);
      return {
        address,
        score: 0,
        status: 'ERROR',
        last_score_timestamp: new Date().toISOString(),
        stamps: [],
        evidence: undefined,
      };
    }
  }

  async submitPassport(address: string, signature: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.GITCOIN_API_URL}/registry/submit-passport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.scorerApiKey,
        },
        body: JSON.stringify({
          address,
          scorer_id: this.scorerId,
          signature,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to submit passport: ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error submitting passport:', error);
      return false;
    }
  }

  async isHuman(address: string, minScore: number = 20): Promise<boolean> {
    try {
      const score = await this.getScore(address);
      return score.score >= minScore;
    } catch {
      return false;
    }
  }

  getAvailableStamps(): string[] {
    return [
      'Google',
      'Twitter',
      'Discord',
      'Github',
      'Linkedin',
      'Facebook',
      'Ens',
      'Lens',
      'POAP',
      'NFT',
      'GuildXYZ',
      'BrightID',
      'Idena',
      'ClearGov',
      'GitcoinContributorStatistics',
      'GitcoinGranteeStatistics',
      'GitPOAP',
      'ethPossessionsGte#1',
      'ethPossessionsGte#10',
      'ethPossessionsGte#32',
    ];
  }

  getStampWeights(): Record<string, number> {
    return {
      BrightID: 10,
      Idena: 10,
      Github: 8,
      Linkedin: 8,
      Google: 5,
      Twitter: 5,
      Discord: 5,
      Ens: 5,
      POAP: 2,
      NFT: 2,
      Facebook: 3,
    };
  }

  getScoreColor(score: number): string {
    if (score >= 50) return 'text-green-500';
    if (score >= 20) return 'text-yellow-500';
    return 'text-red-500';
  }

  getScoreLabel(score: number): string {
    if (score >= 50) return 'High Trust';
    if (score >= 20) return 'Medium Trust';
    return 'Low Trust';
  }

  getScoreBadgeClass(score: number): string {
    if (score >= 50) return 'bg-green-500/20 text-green-600 border-green-200';
    if (score >= 20) return 'bg-yellow-500/20 text-yellow-600 border-yellow-200';
    return 'bg-red-500/20 text-red-600 border-red-200';
  }
}
