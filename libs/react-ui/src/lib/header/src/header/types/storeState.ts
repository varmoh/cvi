export interface UserInfo {
  JWTCreated: string;
  JWTExpirationTimestamp: string;
  firstName: string;
  lastName: string;
  loggedInDate: string;
  loginExpireDate: string;
  authMethod: string;
  fullName: string;
  authorities: string[];
  displayName: string;
  idCode: string;
  email: string;
}

export interface StoreState {
  userInfo: UserInfo | null;
  setUserInfo: (data: UserInfo) => void;
}
