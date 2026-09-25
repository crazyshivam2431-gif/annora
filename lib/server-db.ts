import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export const databaseMode = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'supabase' : 'sqlite';
export const isExternalDatabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const dataDirectory = join(process.cwd(), 'data');
mkdirSync(dataDirectory, { recursive: true });

const defaultAdminEmail = process.env.ADMIN_EMAIL ?? 'admin@annora.in';
const defaultAdminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
const defaultAdminName = process.env.ADMIN_NAME ?? 'ANNORA Admin';
const defaultAdminCity = process.env.ADMIN_CITY ?? 'Jaipur';
const defaultAdminPhone = process.env.ADMIN_PHONE ?? '+91 90000 00000';

const database = new DatabaseSync(join(dataDirectory, 'annora.sqlite'));
database.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('donor', 'ngo', 'driver', 'admin')),
    city TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ngos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    description TEXT NOT NULL,
    authorized_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    max_capacity INTEGER NOT NULL,
    current_capacity INTEGER NOT NULL DEFAULT 0,
    daily_meal_requirement INTEGER NOT NULL,
    food_preferences TEXT NOT NULL,
    operating_hours TEXT NOT NULL,
    availability TEXT NOT NULL DEFAULT 'AVAILABLE',
    verification_status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY,
    donor_id TEXT NOT NULL REFERENCES users(id),
    food_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    food_type TEXT NOT NULL,
    preparation_time TEXT NOT NULL,
    safe_until TEXT NOT NULL,
    pickup_time TEXT NOT NULL,
    pickup_address TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'POSTED',
    ngo_id TEXT REFERENCES ngos(id),
    driver_id TEXT REFERENCES users(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS donation_events (
    id TEXT PRIMARY KEY,
    donation_id TEXT NOT NULL REFERENCES donations(id),
    status TEXT NOT NULL,
    note TEXT NOT NULL,
    actor_id TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS impact_events (
    id TEXT PRIMARY KEY,
    donation_id TEXT NOT NULL REFERENCES donations(id),
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS support_requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    request_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS volunteer_applications (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    availability TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export type ServerUser = { id: string; name: string; email: string; role: 'donor' | 'ngo' | 'driver' | 'admin'; city: string; phone: string };

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${randomBytes(12).toString('hex')}`;
const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

ensureDefaultAdminUser();

const verifyPassword = (password: string, stored: string) => {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
};

const mapUser = (row: any): ServerUser => ({ id: row.id, name: row.name, email: row.email, role: row.role, city: row.city, phone: row.phone });

function ensureDefaultAdminUser() {
  const existing = database.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(defaultAdminEmail) as { id: string } | undefined;
  if (existing) return;

  database.prepare('INSERT INTO users (id, name, email, password_hash, role, city, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id('user'), defaultAdminName, defaultAdminEmail, hashPassword(defaultAdminPassword), 'admin', defaultAdminCity, defaultAdminPhone, now());
}

export function createUser(input: { name: string; email: string; password: string; role: ServerUser['role']; city: string; phone: string }) {
  const user = { id: id('user'), ...input, password_hash: hashPassword(input.password), created_at: now() };
  try {
    database.prepare('INSERT INTO users (id, name, email, password_hash, role, city, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(user.id, user.name, user.email, user.password_hash, user.role, user.city, user.phone, user.created_at);
    return { user: mapUser(user), error: null };
  } catch (error) {
    return { user: null, error: String(error).includes('UNIQUE') ? 'An account with this email already exists.' : 'Unable to create account.' };
  }
}

export function authenticateUser(email: string, password: string) {
  const row = database.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email) as any;
  if (!row || !verifyPassword(password, row.password_hash)) return { user: null, error: 'Invalid email or password.' };
  return { user: mapUser(row), error: null };
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  database.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expires);
  return token;
}

export function getUserBySession(token: string | undefined) {
  if (!token) return null;
  const row = database.prepare('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?').get(token, now()) as any;
  return row ? mapUser(row) : null;
}

export function deleteSession(token: string | undefined) {
  if (token) database.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

type DonationInput = { donorId: string; foodName: string; category: string; quantity: number; unit: string; foodType: string; preparationTime: string; safeUntil: string; pickupTime: string; pickupAddress: string; location: string; description: string };
export type DonationStatus = 'POSTED' | 'MATCHED' | 'DRIVER_ASSIGNED' | 'EN_ROUTE_TO_PICKUP' | 'ARRIVED_AT_PICKUP' | 'PICKED_UP' | 'EN_ROUTE_TO_NGO' | 'ARRIVED_AT_DESTINATION' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED' | 'FAILED';

const lifecycle: Record<DonationStatus, DonationStatus[]> = {
  POSTED: ['MATCHED', 'CANCELLED', 'EXPIRED', 'FAILED'],
  MATCHED: ['DRIVER_ASSIGNED', 'CANCELLED', 'EXPIRED', 'FAILED'],
  DRIVER_ASSIGNED: ['EN_ROUTE_TO_PICKUP', 'CANCELLED', 'EXPIRED', 'FAILED'],
  EN_ROUTE_TO_PICKUP: ['ARRIVED_AT_PICKUP', 'CANCELLED', 'EXPIRED', 'FAILED'],
  ARRIVED_AT_PICKUP: ['PICKED_UP', 'CANCELLED', 'EXPIRED', 'FAILED'],
  PICKED_UP: ['EN_ROUTE_TO_NGO', 'FAILED'],
  EN_ROUTE_TO_NGO: ['ARRIVED_AT_DESTINATION', 'FAILED'],
  ARRIVED_AT_DESTINATION: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  CANCELLED: [],
  EXPIRED: [],
  FAILED: [],
};

const notify = (userId: string, title: string, message: string, link: string, timestamp = now()) => {
  database.prepare('INSERT INTO notifications (id, user_id, title, message, link, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id('notification'), userId, title, message, link, timestamp);
};

const recordDonationEvent = (donationId: string, status: DonationStatus, note: string, actorId?: string, timestamp = now()) => {
  database.prepare('INSERT INTO donation_events (id, donation_id, status, note, actor_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id('event'), donationId, status, note, actorId ?? null, timestamp);
};

export function createDonation(input: DonationInput) {
  const donationId = id('donation');
  const timestamp = now();
  database.prepare('INSERT INTO donations (id, donor_id, food_name, category, quantity, unit, food_type, preparation_time, safe_until, pickup_time, pickup_address, location, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(donationId, input.donorId, input.foodName, input.category, input.quantity, input.unit, input.foodType, input.preparationTime, input.safeUntil, input.pickupTime, input.pickupAddress, input.location, input.description, timestamp, timestamp);
  recordDonationEvent(donationId, 'POSTED', 'Donation posted by donor.', input.donorId, timestamp);
  matchDonation(donationId, input.donorId);
  return donationId;
}

export function matchDonation(donationId: string, actorId?: string) {
  const donation = database.prepare('SELECT * FROM donations WHERE id = ?').get(donationId) as any;
  if (!donation || !['POSTED', 'MATCHED'].includes(donation.status)) return { donation: null, error: 'Donation is not available for matching.' };
  const ngos = database.prepare("SELECT id, user_id, name, city, max_capacity, current_capacity, food_preferences FROM ngos WHERE verification_status = 'APPROVED' AND availability = 'AVAILABLE'").all() as any[];
  const compatible = ngos.filter((ngo) => {
    const capacity = Number(ngo.max_capacity ?? 0) - Number(ngo.current_capacity ?? 0);
    const preferences = String(ngo.food_preferences ?? '').toLowerCase();
    return capacity >= Number(donation.quantity) && (!preferences || preferences.includes(String(donation.food_type).toLowerCase()) || preferences.includes('cooked') || preferences.includes('packaged'));
  }).sort((left, right) => Number(String(left.city).toLowerCase() !== String(donation.location).toLowerCase()) - Number(String(right.city).toLowerCase() !== String(donation.location).toLowerCase()));
  const ngo = compatible[0];
  if (!ngo) return { donation, error: 'No eligible verified NGO is currently available.' };
  const timestamp = now();
  database.prepare("UPDATE donations SET ngo_id = ?, status = 'MATCHED', updated_at = ? WHERE id = ?").run(ngo.id, timestamp, donationId);
  recordDonationEvent(donationId, 'MATCHED', `Matched with ${ngo.name} based on verification, capacity, food preference, and location.`, actorId, timestamp);
  notify(ngo.user_id, 'Donation matched', `${donation.quantity} ${donation.unit} of ${donation.food_name} has been matched to your organisation.`, '/dashboard/ngo', timestamp);
  notify(donation.donor_id, 'Donation matched', `Your donation has been matched with ${ngo.name}.`, `/donations/${donationId}`, timestamp);
  return { donation: { ...donation, ngo_id: ngo.id, status: 'MATCHED' }, match: { ngoId: ngo.id, ngoName: ngo.name }, error: null };
}

export function assignDriver(donationId: string, actor: ServerUser, requestedDriverId?: string) {
  const donation = database.prepare('SELECT * FROM donations WHERE id = ?').get(donationId) as any;
  if (!donation || donation.status !== 'MATCHED') return { error: 'Only matched donations can be assigned.' };
  const ngo = donation.ngo_id ? database.prepare('SELECT * FROM ngos WHERE id = ?').get(donation.ngo_id) as any : null;
  const authorized = actor.role === 'admin' || (actor.role === 'ngo' && ngo?.user_id === actor.id);
  const selfAssign = actor.role === 'driver' && !requestedDriverId;
  if (!authorized && !selfAssign) return { error: 'You are not allowed to assign this donation.' };
  const driverId = requestedDriverId ?? actor.id;
  const driver = database.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'driver'").get(driverId) as any;
  if (!driver) return { error: 'A valid driver account is required.' };
  const active = database.prepare("SELECT COUNT(*) AS count FROM donations WHERE driver_id = ? AND status IN ('DRIVER_ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_NGO')").get(driverId) as { count: number };
  if (active.count > 0) return { error: 'This driver already has an active delivery.' };
  const timestamp = now();
  database.prepare("UPDATE donations SET driver_id = ?, status = 'DRIVER_ASSIGNED', updated_at = ? WHERE id = ?").run(driverId, timestamp, donationId);
  recordDonationEvent(donationId, 'DRIVER_ASSIGNED', `Driver ${driver.name} assigned to the rescue.`, actor.id, timestamp);
  notify(donation.donor_id, 'Driver assigned', `${driver.name} has been assigned to your donation.`, `/donations/${donationId}`, timestamp);
  if (ngo) notify(ngo.user_id, 'Driver assigned', `${driver.name} will coordinate pickup for the matched donation.`, '/dashboard/ngo', timestamp);
  notify(driverId, 'New pickup assignment', `${donation.quantity} ${donation.unit} of ${donation.food_name} is ready for pickup.`, '/dashboard/driver', timestamp);
  return { donationId, driverId, status: 'DRIVER_ASSIGNED' as const };
}

export function transitionDonation(donationId: string, actor: ServerUser, nextStatus: DonationStatus, note = '') {
  const donation = database.prepare('SELECT * FROM donations WHERE id = ?').get(donationId) as any;
  if (!donation) return { error: 'Donation not found.' };
  if (!lifecycle[donation.status as DonationStatus]?.includes(nextStatus)) return { error: `Cannot move donation from ${donation.status} to ${nextStatus}.` };
  const ngo = donation.ngo_id ? database.prepare('SELECT * FROM ngos WHERE id = ?').get(donation.ngo_id) as any : null;
  const authorized = actor.role === 'admin' || actor.id === donation.donor_id || actor.id === donation.driver_id || actor.id === ngo?.user_id;
  if (!authorized) return { error: 'You are not allowed to update this donation.' };
  if (actor.id === donation.donor_id && nextStatus !== 'CANCELLED') return { error: 'Donors can only cancel their own donation.' };
  if (['PICKED_UP', 'EN_ROUTE_TO_PICKUP', 'EN_ROUTE_TO_NGO', 'DELIVERED'].includes(nextStatus) && actor.role !== 'driver' && actor.role !== 'admin') return { error: 'Only the assigned driver or admin can update delivery progress.' };
  const timestamp = now();
  database.prepare('UPDATE donations SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, timestamp, donationId);
  recordDonationEvent(donationId, nextStatus, note || `Donation status updated to ${nextStatus}.`, actor.id, timestamp);
  if (nextStatus === 'DELIVERED') {
    database.prepare('INSERT INTO impact_events (id, donation_id, type, amount, created_at) VALUES (?, ?, ?, ?, ?)').run(id('impact'), donationId, 'meals_rescued', Number(donation.quantity), timestamp);
    database.prepare('INSERT INTO impact_events (id, donation_id, type, amount, created_at) VALUES (?, ?, ?, ?, ?)').run(id('impact'), donationId, 'food_diverted_estimate', Math.round(Number(donation.quantity) * 0.21), timestamp);
    if (ngo?.id) database.prepare('INSERT INTO impact_events (id, donation_id, type, amount, created_at) VALUES (?, ?, ?, ?, ?)').run(id('impact'), donationId, 'shelter_served', 1, timestamp);
  }
  const recipients = new Set([donation.donor_id, donation.driver_id, ngo?.user_id].filter(Boolean) as string[]);
  const message = `Donation ${donation.food_name} is now ${nextStatus.replaceAll('_', ' ').toLowerCase()}.`;
  recipients.forEach((userId) => notify(userId, 'Rescue update', message, `/donations/${donationId}`, timestamp));
  return { donationId, status: nextStatus };
}

export function getDonationsForUser(userId: string) {
  return database.prepare('SELECT * FROM donations WHERE donor_id = ? ORDER BY created_at DESC').all(userId);
}

export function getDonationById(donationId: string) {
  return database.prepare('SELECT * FROM donations WHERE id = ?').get(donationId) as Record<string, unknown> | undefined;
}

export function getDonationDetails(donationId: string, user: ServerUser) {
  const donation = database.prepare('SELECT d.*, n.name AS ngo_name, n.user_id AS ngo_user_id, u.name AS driver_name FROM donations d LEFT JOIN ngos n ON n.id = d.ngo_id LEFT JOIN users u ON u.id = d.driver_id WHERE d.id = ?').get(donationId) as any;
  if (!donation) return null;
  const authorized = user.role === 'admin' || user.id === donation.donor_id || user.id === donation.driver_id || user.id === donation.ngo_user_id;
  if (!authorized) return null;
  const events = database.prepare('SELECT id, status, note, created_at FROM donation_events WHERE donation_id = ? ORDER BY created_at ASC').all(donationId);
  return { donation, events };
}

export function getRescueData() {
  return {
    donations: database.prepare("SELECT id, food_name, quantity, unit, status, location, pickup_address, created_at FROM donations WHERE status NOT IN ('DELIVERED', 'CANCELLED', 'EXPIRED') ORDER BY created_at DESC LIMIT 100").all(),
    ngos: database.prepare("SELECT id, name, city, availability, verification_status, current_capacity, max_capacity FROM ngos WHERE availability != 'CLOSED'").all(),
  };
}

export function getNotificationsForUser(userId: string) {
  return database.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(userId);
}

export function markNotificationsRead(userId: string) {
  database.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
}

export function getDashboardData(user: ServerUser) {
  const notifications = getNotificationsForUser(user.id);
  if (user.role === 'donor') {
    const donations = getDonationsForUser(user.id);
    const completed = donations.filter((donation: any) => donation.status === 'DELIVERED');
    return {
      role: user.role,
      donations: donations.map((donation: any) => ({ id: donation.id, foodName: donation.food_name, quantity: donation.quantity, unit: donation.unit, status: donation.status, location: donation.location, createdAt: donation.created_at })),
      notifications,
      stats: {
        active: donations.filter((donation: any) => !['DELIVERED', 'CANCELLED', 'EXPIRED'].includes(donation.status)).length,
        completed: completed.length,
        meals: completed.reduce((sum: number, donation: any) => sum + Number(donation.quantity ?? 0), 0),
        diverted: Math.round(completed.reduce((sum: number, donation: any) => sum + Number(donation.quantity ?? 0), 0) * 0.21),
      },
    };
  }

  if (user.role === 'ngo') {
    const ngo = database.prepare('SELECT id, name, max_capacity, current_capacity, availability, verification_status FROM ngos WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(user.id) as any;
    const donations = ngo ? database.prepare('SELECT id, food_name, quantity, unit, status, location, created_at FROM donations WHERE ngo_id = ? ORDER BY created_at DESC LIMIT 20').all(ngo.id) : [];
    return {
      role: user.role,
      ngo,
      donations,
      notifications,
      stats: {
        currentCapacity: ngo?.current_capacity ?? 0,
        maxCapacity: ngo?.max_capacity ?? 0,
        incoming: (donations as any[]).filter((donation) => !['DELIVERED', 'CANCELLED', 'EXPIRED'].includes(donation.status)).length,
        received: (donations as any[]).filter((donation) => donation.status === 'DELIVERED').reduce((sum, donation) => sum + Number(donation.quantity ?? 0), 0),
      },
    };
  }

  if (user.role === 'driver') {
    const assigned = database.prepare("SELECT id, food_name, quantity, unit, status, location, pickup_address, safe_until, created_at FROM donations WHERE driver_id = ? ORDER BY created_at DESC LIMIT 20").all(user.id);
    return {
      role: user.role,
      assignments: assigned,
      notifications,
      stats: {
        activeRequests: database.prepare("SELECT COUNT(*) AS count FROM donations WHERE status IN ('POSTED', 'MATCHING', 'MATCHED') AND driver_id IS NULL").get() as { count: number },
        assigned: (assigned as any[]).filter((donation) => !['DELIVERED', 'CANCELLED', 'EXPIRED'].includes(donation.status)).length,
        deliveries: (assigned as any[]).filter((donation) => donation.status === 'DELIVERED').length,
      },
    };
  }

  return {
    role: user.role,
    notifications,
    stats: {
      users: (database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count,
      pendingNgo: (database.prepare("SELECT COUNT(*) AS count FROM ngos WHERE verification_status = 'PENDING'").get() as { count: number }).count,
      activeDonations: (database.prepare("SELECT COUNT(*) AS count FROM donations WHERE status NOT IN ('DELIVERED', 'CANCELLED', 'EXPIRED')").get() as { count: number }).count,
    },
  };
}

export function createNgo(input: { userId: string; name: string; registrationNumber: string; description: string; authorizedPerson: string; phone: string; email: string; address: string; city: string; state: string; pincode: string; maxCapacity: number; currentCapacity: number; dailyMealRequirement: number; foodPreferences: string[]; operatingHours: string }) {
  const ngoId = id('ngo');
  database.prepare('INSERT INTO ngos (id, user_id, name, registration_number, description, authorized_person, phone, email, address, city, state, pincode, max_capacity, current_capacity, daily_meal_requirement, food_preferences, operating_hours, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(ngoId, input.userId, input.name, input.registrationNumber, input.description, input.authorizedPerson, input.phone, input.email, input.address, input.city, input.state, input.pincode, input.maxCapacity, input.currentCapacity, input.dailyMealRequirement, JSON.stringify(input.foodPreferences), input.operatingHours, now());
  return ngoId;
}

export function createSupportRequest(input: { name: string; phone: string; email: string; requestType: string; message: string }) {
  const requestId = id('support');
  database.prepare('INSERT INTO support_requests (id, name, phone, email, request_type, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(requestId, input.name, input.phone, input.email, input.requestType, input.message, now());
  return requestId;
}

export function createVolunteerApplication(input: { name: string; phone: string; email: string; city: string; availability: string }) {
  const applicationId = id('volunteer');
  database.prepare('INSERT INTO volunteer_applications (id, name, phone, email, city, availability, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(applicationId, input.name, input.phone, input.email, input.city, input.availability, now());
  return applicationId;
}

export function getImpactStats() {
  const meals = database.prepare("SELECT COALESCE(SUM(CASE WHEN type = 'meals_rescued' THEN amount ELSE 0 END), 0) AS meals, COALESCE(SUM(CASE WHEN type = 'food_diverted_estimate' THEN amount ELSE 0 END), 0) AS diverted, COALESCE(SUM(CASE WHEN type = 'shelter_served' THEN amount ELSE 0 END), 0) AS shelters, COUNT(DISTINCT donation_id) AS deliveries FROM impact_events").get() as { meals: number; diverted: number; shelters: number; deliveries: number };
  return {
    mealsRescued: meals.meals,
    foodDiverted: meals.diverted,
    sheltersServed: meals.shelters,
    deliveriesCompleted: meals.deliveries,
  };
}

export function getNgoVerificationQueue() {
  return database.prepare('SELECT id, user_id, name, registration_number, description, authorized_person, email, phone, city, state, max_capacity, current_capacity, daily_meal_requirement, availability, verification_status, created_at FROM ngos ORDER BY created_at DESC').all();
}

export function updateNgoVerification(ngoId: string, actor: ServerUser, status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED') {
  if (actor.role !== 'admin') return { error: 'Admin access required.' };
  const ngo = database.prepare('SELECT id, user_id, name FROM ngos WHERE id = ?').get(ngoId) as { id: string; user_id: string; name: string } | undefined;
  if (!ngo) return { error: 'NGO not found.' };
  database.prepare('UPDATE ngos SET verification_status = ? WHERE id = ?').run(status, ngoId);
  notify(ngo.user_id, 'NGO verification update', `${ngo.name} verification status is now ${status.replaceAll('_', ' ').toLowerCase()}.`, '/dashboard/ngo');
  return { ngoId, status };
}