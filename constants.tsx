
import { MarketplaceItem, Category, StudyNote } from './types';

export const BVDU_COORDINATES = {
  latitude: 18.4575,
  longitude: 73.8508
};

export const CENTRAL_LIBRARY_COORDINATES = {
  latitude: 18.4578,
  longitude: 73.8502
};

export const HANDOVER_DISTANCE_THRESHOLD_METERS = 100;

// Reliable public PDF for demo purposes
const DEMO_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

export const MOCK_ITEMS: MarketplaceItem[] = [
  {
    id: '1',
    title: 'Mini-Drafter (Grade A)',
    description: 'High-precision mini drafter for Engineering Graphics. Verified Grade A condition by UniShare AI.',
    price: 850,
    listingType: 'Sell',
    category: Category.ENGINEERING_GRAPHICS_KITS,
    department: '1st Year (General)',
    owner: 'Rahul Sharma',
    ownerEmail: 'rahul.s@bvuniversity.edu.in',
    ownerKarma: 145,
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&h=300',
    condition: 'Excellent',
    createdAt: '1h ago',
    carbonSaved: 1.6
  },
  {
    id: '2',
    title: 'Drawing Sheet Container (New)',
    description: 'Expandable waterproof container for A1/A2 sheets. Essential for civil and mech students.',
    price: 350,
    listingType: 'Sell',
    category: Category.DRAWING_SHEET_CONTAINERS,
    department: '1st Year (General)',
    owner: 'Snehal T.',
    ownerEmail: 'snehal.t@bvuniversity.edu.in',
    ownerKarma: 42,
    imageUrl: 'https://images.unsplash.com/photo-1513364235641-79a44005e133?auto=format&fit=crop&w=400&h=300',
    condition: 'New',
    createdAt: '3h ago',
    carbonSaved: 0.3
  },
  {
    id: '3',
    title: 'E&TC Load Sensor (Industrial)',
    description: 'Precision load cell for weight-sensing projects. Used in TE final year automation project.',
    price: 1200,
    listingType: 'Sell',
    category: Category.SENSORS,
    department: 'E&TC',
    owner: 'Priya Patil',
    ownerEmail: 'priya.p@bvuniversity.edu.in',
    ownerKarma: 88,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=300',
    condition: 'Good',
    createdAt: '4h ago',
    carbonSaved: 0.8
  }
];

export const MOCK_NOTES: StudyNote[] = [
  {
    id: 'n1',
    title: 'Applied Mathematics - III (M3) Complete PDF',
    subject: 'M3',
    department: 'Computer',
    semester: 3,
    author: 'Prof. Deshmukh',
    authorEmail: 'admin@bvuniversity.edu.in',
    isAuthorVerified: true,
    fileUrl: DEMO_PDF_URL,
    format: 'PDF (Softcopy)',
    downloads: 145
  },
  {
    id: 'n2',
    title: 'Data Structures & Algorithms Handwritten',
    subject: 'DSA',
    department: 'IT',
    semester: 4,
    author: 'Siddharth J.',
    authorEmail: 'siddharth@bvuniversity.edu.in',
    isAuthorVerified: true,
    fileUrl: DEMO_PDF_URL,
    format: 'Hardcopy (Handwritten)',
    downloads: 89
  },
  {
    id: 'n3',
    title: 'Microprocessor 8086 Instruction Set',
    subject: 'MP',
    department: 'E&TC',
    semester: 5,
    author: 'Library Scanned',
    authorEmail: 'admin@bvuniversity.edu.in',
    isAuthorVerified: true,
    fileUrl: DEMO_PDF_URL,
    format: 'PDF (Softcopy)',
    downloads: 210
  }
];
