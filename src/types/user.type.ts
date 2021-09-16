export type User = {
  _id: string;
  email: string;
  role: string;
  emailVerified: IsActive;
  username: string;
  password: Password;
  newsletterConsent: IsActive;
  _rev: string;
}

export interface UserProvider extends User {
  providerData: {
    firstName: string;
    lastName: string;
    businessVerified: IsActive;
    company: string;
    street: string;
    zipCode: number;
    city: string;
  }
}

export type RequestUser = {
  user: {
    _id: string,
    username: string
  }
};

export type RequestUserBody = {
  body: Object,
  user: {
    _id: string,
    username: string
  }
};

export type SubmittedUser = {
  email: string;
  role: string;
  emailVerified: IsActive;
  username: string;
  password: string;
  newsletterConsent: IsActive;
}

export type SubmittedProviderData = {
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  zipCode: number;
  city: string;
}

export type Password = {
  salt: string;
  passwordHash: string;
}

type IsActive = {
  active: boolean;
  timestamp: string;
}