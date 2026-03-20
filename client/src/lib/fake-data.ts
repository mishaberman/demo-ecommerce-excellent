/**
 * Random fake data generator for auto-filling checkout, contact, and register forms.
 * Generates realistic-looking PII data each time the page loads.
 */

const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Luna', 'Daniel',
  'Camila', 'Michael', 'Gianna', 'Sebastian', 'Aria', 'Jack', 'Penelope',
  'Owen', 'Layla', 'Theodore', 'Chloe', 'Aiden', 'Riley', 'Samuel',
  'Zoey', 'Ryan', 'Nora', 'Leo', 'Lily', 'Mateo', 'Eleanor', 'David',
  'Hannah', 'Joseph', 'Lillian', 'John', 'Addison', 'Luke',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts',
];

const STREET_NAMES = [
  'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Elm St', 'Pine Rd',
  'Washington Blvd', 'Park Ave', 'Lake Dr', 'Hill St', 'River Rd',
  'Sunset Blvd', 'Broadway', 'Highland Ave', 'Forest Dr', 'Meadow Ln',
  'Spring St', 'Valley Rd', 'Church St', 'School Ln',
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Jacksonville', 'San Jose',
  'Fort Worth', 'Columbus', 'Charlotte', 'Indianapolis', 'San Francisco',
  'Seattle', 'Denver', 'Nashville', 'Portland', 'Memphis', 'Louisville',
  'Baltimore', 'Milwaukee',
];

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'aol.com', 'mail.com', 'protonmail.com',
];

const COMPANY_NAMES = [
  'Acme Corp', 'Globex Inc', 'Initech', 'Umbrella Co', 'Stark Industries',
  'Wayne Enterprises', 'Hooli', 'Pied Piper', 'Dunder Mifflin', 'Wonka Industries',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(len: number): string {
  let result = '';
  for (let i = 0; i < len; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function randomZip(): string {
  return randomDigits(5);
}

function randomPhone(): string {
  return `(${randomDigits(3)}) ${randomDigits(3)}-${randomDigits(4)}`;
}

function randomCardNumber(): string {
  return `4${randomDigits(3)} ${randomDigits(4)} ${randomDigits(4)} ${randomDigits(4)}`;
}

function randomExpiry(): string {
  const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
  const year = (Math.floor(Math.random() * 5) + 26).toString();
  return `${month}/${year}`;
}

function randomCvv(): string {
  return randomDigits(3);
}

export interface FakeCheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface FakeContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

export interface FakeRegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export function generateFakeCheckoutData(): FakeCheckoutData {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const streetNum = Math.floor(Math.random() * 9999) + 1;
  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomDigits(2)}@${pick(EMAIL_DOMAINS)}`,
    phone: randomPhone(),
    address: `${streetNum} ${pick(STREET_NAMES)}`,
    city: pick(CITIES),
    state: pick(STATES),
    zip: randomZip(),
    cardNumber: randomCardNumber(),
    expiry: randomExpiry(),
    cvv: randomCvv(),
  };
}

export function generateFakeContactData(): FakeContactData {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomDigits(2)}@${pick(EMAIL_DOMAINS)}`,
    phone: randomPhone(),
    company: pick(COMPANY_NAMES),
    message: `Hi, I'm interested in learning more about your products. Could you send me your latest catalog and pricing information? Thanks!`,
  };
}

export function generateFakeRegisterData(): FakeRegisterData {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomDigits(2)}@${pick(EMAIL_DOMAINS)}`,
    phone: randomPhone(),
    password: `P@ss${randomDigits(4)}!`,
  };
}
