export interface Customer {
  title: string;
  firstName: string;
  middleName: string | null;
  lastName: string;         
  suffix: string | null; 
  companyName: string | null;  
}

export interface NewAddress {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null; 
  countryRegion: string | null;
  postalCode: string | null;
  addressType: string | null;
}

export interface Address {
  addressId: number;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null; 
  countryRegion: string | null;
  postalCode: string | null;
  addressType: string | null;
}

export interface UpdatePassword{
  oldPassword: string;
  newPassword: string;
}

export interface securityCustomer{
  emailAddress: string,
  isEmailConfirmed: boolean,
  phoneNumber: string,
  isMfaEnabled: boolean;
}

export interface EmailMfa{
  emailAddress : string,
  isMfaEnabled?: boolean
}

export interface CheckMfaDTO {
   mfaCode?: string;
}

export interface CustomerFiltered {
  firstName: string;
  lastName: string;
  addresses: any[];
}