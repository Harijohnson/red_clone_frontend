export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

export type RegisterInput = {
  name: string
  email: string
  password: string
  phone?: string
}

export type LoginInput = {
  email: string
  password: string
}
