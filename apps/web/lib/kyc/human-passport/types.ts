export interface PassportStamp {
  provider: string;
  credential?: {
    credentialSubject: {
      id: string;
      hash: string;
      provider: string;
    };
    issuanceDate: string;
    expirationDate: string;
  };
}

export interface PassportScore {
  address: string;
  score: number;
  status: 'DONE' | 'PROCESSING' | 'ERROR';
  last_score_timestamp: string;
  stamps?: PassportStamp[];
  evidence?: {
    type: string;
    rawScore: number;
    threshold: number;
  };
}

export interface PassportVerificationStatus {
  isVerified: boolean;
  score: number;
  label: string;
  color: string;
  stamps: PassportStamp[];
}
