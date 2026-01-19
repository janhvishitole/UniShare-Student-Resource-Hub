
export enum Category {
  ENGINEERING_GRAPHICS_KITS = 'Engineering Graphics Kits',
  DRAWING_SHEET_CONTAINERS = 'Drawing Sheet Containers',
  SENSORS = 'Vehicle Sensors',
  HARDWARE = 'Hardware/Tools',
  COMPONENTS = 'Electronic Components',
  GENERAL_ESSENTIALS = 'General Student Essentials'
}

export type Department = 
  | 'Computer' 
  | 'IT' 
  | 'Mechanical' 
  | 'Civil' 
  | 'E&TC' 
  | 'Chemical' 
  | 'Robotics'
  | 'AI&DS'
  | '1st Year (General)';

export type NoteFormat = 'PDF (Softcopy)' | 'Hardcopy (Handwritten)';

export type ListingType = 'Sell' | 'Rent' | 'Free';

export interface StudyNote {
  id: string;
  title: string;
  subject: string;
  department: string;
  semester: number;
  author: string;
  authorEmail: string;
  isAuthorVerified: boolean;
  fileUrl: string;
  format: NoteFormat;
  downloads: number;
  summary?: string; 
}

export interface HonestReview {
  specs: string[];
  faults: string[];
  grading_explanation: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  listingType: ListingType;
  pricePerDay?: number;
  returnDate?: string;
  securityDeposit?: number;
  category: Category;
  department: Department;
  owner: string;
  ownerEmail: string;
  ownerKarma: number;
  imageUrl: string;
  scanVideoUrl?: string; // Reference to the 360 clip
  honestReview?: HonestReview; // Gemini generated inspector report
  condition: string;
  createdAt: string;
  carbonSaved: number;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string;
  department?: Department;
  classYear?: 'FE' | 'SE' | 'TE' | 'BE';
  rollNumber?: string;
  isLoggedIn: boolean;
  karma: number;
  totalCarbonSaved: number;
  isVerified: boolean;
  token?: string; // Simulated JWT Session Token
}

export type QualityGrade = 'A' | 'B' | 'C';

export interface ScanResult {
  toolName: string;
  qualityGrade: QualityGrade;
  condition: 'Excellent' | 'Good' | 'Damaged' | 'Critical';
  score: number;
  findings: string[];
  recommendation: string;
}

export type FeedbackType = 'Positive' | 'Neutral' | 'Negative';

export interface Feedback {
  type: FeedbackType;
  comment: string;
  timestamp: string;
}

export interface JWTDecoded {
  header: any;
  payload: any;
  signature: string;
  isValid: boolean;
}
