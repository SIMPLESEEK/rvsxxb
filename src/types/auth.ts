export type UserRole = 'user' | 'dealer' | 'admin'

export interface User {
  _id?: string
  id?: string
  username: string
  email: string
  password?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  user: {
    id: string
    username: string
    email: string
    role: UserRole
  }
  expires: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  role?: UserRole
}

export interface JWTPayload {
  id: string
  username: string
  role: UserRole
}
