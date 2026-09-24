export type UserRole = 'donor' | 'ngo' | 'driver' | 'admin';

export type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  city?: string;
  phone?: string;
  orgName?: string;
};

export type NgoProfile = {
  id: string;
  userId: string;
  name: string;
  registrationNumber: string;
  description: string;
  authorizedPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  maxCapacity: number;
  currentCapacity: number;
  dailyMealRequirement: number;
  foodPreferences: string[];
  operatingHours: string;
  availability: 'AVAILABLE' | 'FULL' | 'TEMPORARILY UNAVAILABLE' | 'CLOSED';
  verificationStatus: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
};

export type Donation = {
  id: string;
  donorId: string;
  donorName: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  foodType: 'Vegetarian' | 'Non-Vegetarian';
  preparationTime: string;
  safeUntil: string;
  pickupTime: string;
  pickupAddress: string;
  location: string;
  description: string;
  imageUrl?: string;
  status: 'POSTED' | 'MATCHING' | 'MATCHED' | 'DRIVER_ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
  ngoId?: string;
  ngoName?: string;
  driverId?: string;
  driverName?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppStore = {
  users: UserProfile[];
  ngos: NgoProfile[];
  donations: Donation[];
  notifications: NotificationItem[];
  impactEvents: Array<{ id: string; type: string; amount: number; createdAt: string; donationId?: string }>;
  supportRequests?: Array<{ id: string; name: string; phone: string; email: string; requestType: string; message: string; createdAt: string }>;
  volunteerApplications?: Array<{ id: string; name: string; phone: string; email: string; city: string; availability: string; createdAt: string }>;
};

const STORAGE_KEY = 'annora-store-v2';

const emptyStore: AppStore = {
  users: [],
  ngos: [],
  donations: [],
  notifications: [],
  impactEvents: [],
  supportRequests: [],
  volunteerApplications: [],
};

export function readStore(): AppStore {
  if (typeof window === 'undefined') return emptyStore;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    writeStore(emptyStore);
    return emptyStore;
  }

  try {
    return JSON.parse(raw) as AppStore;
  } catch {
    writeStore(emptyStore);
    return emptyStore;
  }
}

export function writeStore(store: AppStore) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

export function getLoggedInUserId() {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem('annora-user');
  return value ? JSON.parse(value).id : null;
}

export function setLoggedInUser(user: UserProfile | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem('annora-user');
    return;
  }
  window.localStorage.setItem('annora-user', JSON.stringify(user));
}

export function getCurrentUser(): UserProfile | null {
  const userId = getLoggedInUserId();
  if (!userId) return null;
  const store = readStore();
  return store.users.find((user) => user.id === userId) ?? null;
}

export function loginWithEmailPassword(email: string, password: string) {
  const store = readStore();
  const user = store.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);
  if (!user) return { user: null, error: 'Invalid email or password.' };
  setLoggedInUser(user);
  return { user, error: null };
}

export function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  city?: string;
  phone?: string;
}) {
  const store = readStore();
  const exists = store.users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase());
  if (exists) {
    return { user: null, error: 'An account with this email already exists.' };
  }

  const user: UserProfile = {
    id: `user-${Date.now()}`,
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    city: payload.city ?? 'Jaipur',
    phone: payload.phone ?? '',
  };

  store.users.push(user);
  writeStore(store);
  setLoggedInUser(user);
  return { user, error: null };
}

export function logoutUser() {
  setLoggedInUser(null);
}

export function createDonation(input: {
  donorId: string;
  donorName: string;
  foodName: string;
  category: string;
  quantity: number;
  unit: string;
  foodType: 'Vegetarian' | 'Non-Vegetarian';
  preparationTime: string;
  safeUntil: string;
  pickupTime: string;
  pickupAddress: string;
  location: string;
  description: string;
}) {
  const store = readStore();
  const donation: Donation = {
    id: `don-${Date.now()}`,
    donorId: input.donorId,
    donorName: input.donorName,
    foodName: input.foodName,
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    foodType: input.foodType,
    preparationTime: input.preparationTime,
    safeUntil: input.safeUntil,
    pickupTime: input.pickupTime,
    pickupAddress: input.pickupAddress,
    location: input.location,
    description: input.description,
    status: 'POSTED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.donations.unshift(donation);
  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: input.donorId,
    title: 'Donation received',
    message: `Your donation for ${input.foodName} has been posted successfully.`,
    link: '/dashboard/donor',
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeStore(store);
  return donation;
}

export function getBestNgoForDonation(donation: Donation) {
  const store = readStore();
  const ngos = store.ngos.filter((ngo) => ngo.verificationStatus === 'APPROVED' && ngo.availability === 'AVAILABLE');
  return ngos[0] ?? null;
}

export function matchDonationToNgo(donationId: string) {
  const store = readStore();
  const donation = store.donations.find((item) => item.id === donationId);
  if (!donation) return null;

  const ngo = getBestNgoForDonation(donation);
  if (!ngo) return null;

  donation.status = 'MATCHED';
  donation.ngoId = ngo.id;
  donation.ngoName = ngo.name;
  donation.updatedAt = new Date().toISOString();

  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: donation.donorId,
    title: 'Donation matched',
    message: `Your donation has been matched with ${ngo.name}.`,
    link: `/dashboard/donor`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeStore(store);
  return donation;
}

export function acceptPickupRequest(donationId: string, driverId: string, driverName: string) {
  const store = readStore();
  const donation = store.donations.find((item) => item.id === donationId);
  if (!donation) return null;

  donation.status = 'DRIVER_ASSIGNED';
  donation.driverId = driverId;
  donation.driverName = driverName;
  donation.updatedAt = new Date().toISOString();

  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: donation.donorId,
    title: 'Driver assigned',
    message: `${driverName} has accepted the pickup for ${donation.foodName}.`,
    link: `/dashboard/donor`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  writeStore(store);
  return donation;
}

export function updateDonationStatus(donationId: string, status: Donation['status']) {
  const store = readStore();
  const donation = store.donations.find((item) => item.id === donationId);
  if (!donation) return null;
  donation.status = status;
  donation.updatedAt = new Date().toISOString();

  if (status === 'DELIVERED') {
    store.impactEvents.unshift({
      id: `impact-${Date.now()}`,
      type: 'meals_rescued',
      amount: donation.quantity,
      createdAt: new Date().toISOString(),
      donationId: donation.id,
    });
  }

  writeStore(store);
  return donation;
}

export function getNotificationsForUser(userId: string) {
  const store = readStore();
  return store.notifications.filter((notification) => notification.userId === userId || notification.userId === 'all');
}

export function getUserDonations(userId: string) {
  const store = readStore();
  return store.donations.filter((donation) => donation.donorId === userId);
}

export function getImpactStats() {
  const store = readStore();
  const deliveredDonations = store.donations.filter((donation) => donation.status === 'DELIVERED');
  const mealsRescued = deliveredDonations.reduce((total, donation) => total + donation.quantity, 0);
  const sheltersServed = new Set(deliveredDonations.map((donation) => donation.ngoId)).size;
  const deliveriesCompleted = deliveredDonations.length;
  const foodDiverted = Math.round(mealsRescued * 0.21);
  return { mealsRescued, foodDiverted, sheltersServed, deliveriesCompleted };
}

export function getDashboardSummary(role: UserRole) {
  const store = readStore();
  if (role === 'donor') {
    return {
      active: store.donations.filter((donation) => donation.status !== 'DELIVERED' && donation.status !== 'CANCELLED').length,
      completed: store.donations.filter((donation) => donation.status === 'DELIVERED').length,
      meals: store.donations.filter((donation) => donation.status === 'DELIVERED').reduce((sum, donation) => sum + donation.quantity, 0),
      diverted: Math.round(store.donations.filter((donation) => donation.status === 'DELIVERED').reduce((sum, donation) => sum + donation.quantity, 0) * 0.21),
    };
  }

  if (role === 'ngo') {
    const approvedNgo = store.ngos[0];
    return {
      currentCapacity: approvedNgo?.currentCapacity ?? 0,
      incoming: store.donations.filter((donation) => donation.status === 'MATCHED').length,
      received: store.donations.filter((donation) => donation.status === 'DELIVERED').reduce((sum, donation) => sum + donation.quantity, 0),
    };
  }

  if (role === 'driver') {
    return {
      activeRequests: store.donations.filter((donation) => donation.status === 'MATCHED').length,
      assigned: store.donations.filter((donation) => donation.driverId === 'user-driver').length,
      deliveries: store.donations.filter((donation) => donation.status === 'DELIVERED' && donation.driverId === 'user-driver').length,
    };
  }

  return {
    users: store.users.length,
    pendingNgo: store.ngos.filter((ngo) => ngo.verificationStatus === 'PENDING').length,
    activeDonations: store.donations.filter((donation) => donation.status !== 'DELIVERED').length,
  };
}

export function updateNgoStatus(ngoId: string, status: NgoProfile['verificationStatus']) {
  const store = readStore();
  const ngo = store.ngos.find((item) => item.id === ngoId);
  if (!ngo) return null;
  ngo.verificationStatus = status;
  writeStore(store);
  return ngo;
}

export function updateNgoAvailability(ngoId: string, availability: NgoProfile['availability']) {
  const store = readStore();
  const ngo = store.ngos.find((item) => item.id === ngoId);
  if (!ngo) return null;
  ngo.availability = availability;
  writeStore(store);
  return ngo;
}

export function createNgoProfile(payload: Omit<NgoProfile, 'id' | 'userId' | 'verificationStatus' | 'availability'> & { userId: string }) {
  const store = readStore();
  const profile: NgoProfile = {
    ...payload,
    id: `ngo-${Date.now()}`,
    userId: payload.userId,
    verificationStatus: 'PENDING',
    availability: 'AVAILABLE',
  };
  store.ngos.push(profile);
  writeStore(store);
  return profile;
}

export function createDriverProfile(user: UserProfile, vehicleType: string, vehicleCapacity: string) {
  const store = readStore();
  const existing = store.users.find((item) => item.id === user.id);
  if (existing) {
    existing.phone = existing.phone || '0000000000';
  }
  writeStore(store);
  return { vehicleType, vehicleCapacity };
}

export function createSupportRequest(input: { name: string; phone: string; email: string; requestType: string; message: string }) {
  const store = readStore();
  const request = { id: `support-${Date.now()}`, ...input, createdAt: new Date().toISOString() };
  store.supportRequests = [request, ...(store.supportRequests ?? [])];
  writeStore(store);
  return request;
}

export function createVolunteerApplication(input: { name: string; phone: string; email: string; city: string; availability: string }) {
  const store = readStore();
  const application = { id: `volunteer-${Date.now()}`, ...input, createdAt: new Date().toISOString() };
  store.volunteerApplications = [application, ...(store.volunteerApplications ?? [])];
  writeStore(store);
  return application;
}

export function submitZevaReply(message: string, userRole: UserRole) {
  const store = readStore();
  const lower = message.toLowerCase();

  if (lower.includes('what can you do') || lower.includes('help me') || lower.includes('capabilities')) {
    return 'I can guide you through donating surplus food, finding support, registering an NGO, joining as a volunteer, tracking a rescue, checking impact, and using your ANNORA account.';
  }

  if (lower.includes('hello') || lower.includes('hi ') || lower === 'hi' || lower.includes('namaste')) {
    return 'Namaste! I can help with food donations, shelter support, rescue tracking, volunteering, and your ANNORA account.';
  }

  if (lower.includes('donate') || lower.includes('food') || lower.includes('meal') || lower.includes('khana')) {
    return 'To donate surplus food, open Donate Food, enter the quantity, food type, pickup address, and safe-until time. You must be logged in to post it.';
  }

  if (lower.includes('support') || lower.includes('shelter') || lower.includes('ngo')) {
    const ngo = store.ngos.find((item) => item.verificationStatus === 'APPROVED');
    return ngo ? `I found ${ngo.name} as a verified shelter with available capacity. Open Find Support to review support options.` : 'No eligible nearby shelter is currently available.';
  }

  if (lower.includes('volunteer') || lower.includes('driver') || lower.includes('join')) {
    return 'You can join ANNORA as a donor, NGO, or driver volunteer. Open Register and choose the role that fits you.';
  }

  if (lower.includes('register') && (lower.includes('ngo') || lower.includes('shelter') || lower.includes('organisation') || lower.includes('organization'))) {
    return 'For NGO onboarding, open Register your NGO from Find Support, enter your organisation details and capacity, then submit it for verification before receiving matched donations.';
  }

  if (lower.includes('privacy') || lower.includes('data') || lower.includes('secure')) {
    return 'ANNORA uses your contact details to coordinate rescue requests and support. Share only information needed for the request, and avoid entering passwords or sensitive documents in chat.';
  }

  if (lower.includes('safe') || lower.includes('hygiene') || lower.includes('expired')) {
    return 'Only list food that is safe to distribute. Add preparation and safe-until times accurately; expired or unsafe donations should not be posted.';
  }

  if (lower.includes('match') || lower.includes('selected') || lower.includes('choose ngo')) {
    return 'ANNORA considers verified status, distance, available capacity, food preference, urgency, and driver availability when suggesting a shelter.';
  }

  if (lower.includes('cancel') || lower.includes('delete')) {
    return 'Open your donation from the donor dashboard to review its status. Contact support before pickup if a posted donation needs to be cancelled.';
  }

  if (lower.includes('contact') || lower.includes('phone') || lower.includes('email') || lower.includes('reach')) {
    return 'You can contact the ANNORA support desk at +91 70734 15826 or shivambindal126@gmail.com. Find Support also has a request form.';
  }

  if (lower.includes('cost') || lower.includes('price') || lower.includes('free')) {
    return 'ANNORA is designed to coordinate community food rescue. There is no charge to ask for support or apply as a volunteer; logistics arrangements may depend on the local network.';
  }

  if (lower.includes('donor') || lower.includes('restaurant') || lower.includes('caterer')) {
    return 'Donors can post surplus meals with quantity, location, pickup time, and a safe-until time. A verified shelter and available driver can then be matched to the request.';
  }

  if (lower.includes('login') || lower.includes('sign in') || lower.includes('account')) {
    return 'Open Login to access your role dashboard. Demo accounts use the password 123456.';
  }

  if (lower.includes('impact')) {
    const stats = getImpactStats();
    return `Your market impact is ${stats.mealsRescued} meals rescued and ${stats.deliveriesCompleted} successful deliveries.`;
  }

  if (lower.includes('status') || lower.includes('track')) {
    const donation = store.donations[0];
    return donation ? `The latest donation status is ${donation.status}.` : 'There is no donation to track yet.';
  }

  if (lower.includes('how does annora') || lower.includes('how it works')) {
    return 'ANNORA connects surplus food donors with verified shelters and drivers to coordinate rescue, pickup, delivery, and measurable impact tracking.';
  }

  if (lower.includes('map') || lower.includes('live rescue') || lower.includes('route')) {
    return 'Open Live Rescue to see active donor, shelter, and driver routes in the rescue network.';
  }

  return `I can help you with ${userRole === 'driver' ? 'pickup requests and delivery updates' : userRole === 'ngo' ? 'shelter capacity and incoming donations' : 'donations, support, rescue tracking, and impact'}. Try asking “How do I donate food?” or “Find a shelter”.`;
}
