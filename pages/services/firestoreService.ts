
import { MarketplaceItem, User, StudyNote } from '../types';
import { MOCK_ITEMS, MOCK_NOTES } from '../constants';

// Collection Keys
const LISTINGS_COLLECTION = 'unishare_listings_v2';
const USERS_COLLECTION = 'unishare_users_v2';
const NOTES_COLLECTION = 'unishare_notes_v2';
const TRADES_COLLECTION = 'unishare_trades_v2';
const WISHLIST_COLLECTION = 'unishare_wishlist_v2';
const SESSION_KEY = 'user';

type Unsubscribe = () => void;
type Listener<T> = (data: T) => void;

const listingsListeners = new Set<Listener<MarketplaceItem[]>>();
const notesListeners = new Set<Listener<StudyNote[]>>();
const userListeners = new Map<string, Set<Listener<User | null>>>();

export const firestoreService = {
  init() {
    if (!localStorage.getItem(LISTINGS_COLLECTION)) {
      localStorage.setItem(LISTINGS_COLLECTION, JSON.stringify(MOCK_ITEMS));
    }
    if (!localStorage.getItem(NOTES_COLLECTION)) {
      // Initialize mock notes with verification status
      const initialNotes = MOCK_NOTES.map(n => ({ ...n, isAuthorVerified: true }));
      localStorage.setItem(NOTES_COLLECTION, JSON.stringify(initialNotes));
    }
    if (!localStorage.getItem(USERS_COLLECTION)) {
      localStorage.setItem(USERS_COLLECTION, JSON.stringify({}));
    }
  },

  // --- Collection Listeners ---
  subscribeToListings(callback: Listener<MarketplaceItem[]>): Unsubscribe {
    listingsListeners.add(callback);
    callback(this.getListings());
    return () => listingsListeners.delete(callback);
  },

  subscribeToNotes(callback: Listener<StudyNote[]>, department?: string): Unsubscribe {
    const wrapper = (allNotes: StudyNote[]) => {
      if (department) {
        callback(allNotes.filter(n => n.department === department));
      } else {
        callback(allNotes);
      }
    };
    notesListeners.add(wrapper);
    wrapper(this.getNotes());
    return () => notesListeners.delete(wrapper);
  },

  subscribeToUser(email: string, callback: Listener<User | null>): Unsubscribe {
    if (!userListeners.has(email)) {
      userListeners.set(email, new Set());
    }
    userListeners.get(email)!.add(callback);
    this.getUser(email).then(user => callback(user));
    return () => {
      const set = userListeners.get(email);
      if (set) {
        set.delete(callback);
        if (set.size === 0) userListeners.delete(email);
      }
    };
  },

  notifyListings() {
    const data = this.getListings();
    listingsListeners.forEach(l => l(data));
  },

  notifyNotes() {
    const data = this.getNotes();
    notesListeners.forEach(l => l(data));
  },

  notifyUser(email: string) {
    this.getUser(email).then(user => {
      userListeners.get(email)?.forEach(l => l(user));
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (session && session.email === email && user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        window.dispatchEvent(new Event('storage'));
      }
    });
  },

  // --- Simulated Cloud Storage ---
  async uploadImage(base64Data: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(base64Data), 500);
    });
  },

  async uploadFile(base64Data: string): Promise<string> {
    return new Promise((resolve) => {
      // Simulate storage path: academic_notes/filename
      setTimeout(() => {
        const id = Math.random().toString(36).substring(7);
        resolve(`https://firebasestorage.googleapis.com/v0/b/unishare/o/academic_notes%2Fnote_${id}.pdf?alt=media`);
      }, 1500);
    });
  },

  // --- Data Accessors ---
  async getUser(email: string): Promise<User | null> {
    const users = JSON.parse(localStorage.getItem(USERS_COLLECTION) || '{}');
    return users[email] || null;
  },

  async saveUser(userData: User): Promise<void> {
    const users = JSON.parse(localStorage.getItem(USERS_COLLECTION) || '{}');
    users[userData.email] = userData;
    localStorage.setItem(USERS_COLLECTION, JSON.stringify(users));
    this.notifyUser(userData.email);
  },

  getListings(): MarketplaceItem[] {
    return JSON.parse(localStorage.getItem(LISTINGS_COLLECTION) || '[]');
  },

  async createListing(item: MarketplaceItem): Promise<void> {
    const listings = this.getListings();
    localStorage.setItem(LISTINGS_COLLECTION, JSON.stringify([item, ...listings]));
    this.notifyListings();
  },

  getNotes(): StudyNote[] {
    return JSON.parse(localStorage.getItem(NOTES_COLLECTION) || '[]');
  },

  async createNote(note: StudyNote): Promise<void> {
    const notes = this.getNotes();
    localStorage.setItem(NOTES_COLLECTION, JSON.stringify([note, ...notes]));
    this.notifyNotes();
  },

  getTradeStatus(itemId: string) {
    const trades = JSON.parse(localStorage.getItem(TRADES_COLLECTION) || '{}');
    return trades[itemId] || null;
  },

  async setTradeStatus(itemId: string, status: string, buyerId: string = 'system') {
    const trades = JSON.parse(localStorage.getItem(TRADES_COLLECTION) || '{}');
    trades[itemId] = { status, buyerId };
    localStorage.setItem(TRADES_COLLECTION, JSON.stringify(trades));
    this.notifyListings();
  },

  getWishlist(userEmail: string): MarketplaceItem[] {
    return JSON.parse(localStorage.getItem(`${WISHLIST_COLLECTION}_${userEmail}`) || '[]');
  },

  async toggleWishlist(userEmail: string, item: MarketplaceItem) {
    let wishlist = this.getWishlist(userEmail);
    const index = wishlist.findIndex(i => i.id === item.id);
    if (index > -1) {
      wishlist.splice(index, 1);
    } else {
      wishlist.push(item);
    }
    localStorage.setItem(`${WISHLIST_COLLECTION}_${userEmail}`, JSON.stringify(wishlist));
    this.notifyListings();
  }
};

firestoreService.init();
