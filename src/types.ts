export interface Study {
  title: string;
  source: string;
  outcome: string;
  application: string;
}

export interface Character {
  name: string;
  role: string;
  age: string;
  origin: string;
  philosophy: string;
  style: string;
  advice: string[];
}

export interface CheatCode {
  id: string;
  vegetable: string;
  topic: string;
  beatrice: string;
  greg: string;
  study?: Study;
  extensionSupport?: string;
  consensus: 'supported' | 'disagreement' | 'trial-needed';
  triedCount: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  zipCode: string;
  isSubscribed: boolean;
  savedCodes: string[];
  triedCodes: string[];
  createdAt: number;
}

export interface LabNote {
  id: string;
  topic: string;
  hypothesis: string;
  userResults: { userId: string; result: string }[];
}
