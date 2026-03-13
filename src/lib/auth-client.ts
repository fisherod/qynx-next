// Shared auth constants for client (sign-in, stake, payment)
import {
  AUTH_SESSION_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USERNAME_KEY,
  AUTH_ROLE_KEY,
  AUTH_USER_ID_KEY,
  AUTH_USER_DATA_KEY,
  EVM_WALLET_DISCONNECTED_KEY,
  SELECTED_NETWORK_KEY,
  SelectedNetwork,
  BITCOIN_WALLET_ADDRESS_KEY,
  BITCOIN_WALLET_ID_KEY,
  BITCOIN_WALLET_DISCONNECTED_KEY,
} from '@/lib/constants'

export type { SelectedNetwork } from '@/lib/constants'

export {
  AUTH_SESSION_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USERNAME_KEY,
  AUTH_ROLE_KEY,
  AUTH_USER_ID_KEY,
  AUTH_USER_DATA_KEY,
  SELECTED_NETWORK_KEY,
  BITCOIN_WALLET_ADDRESS_KEY,
  BITCOIN_WALLET_ID_KEY,
  BITCOIN_WALLET_DISCONNECTED_KEY,
} from '@/lib/constants'

export function setEvmWalletDisconnected(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(EVM_WALLET_DISCONNECTED_KEY, '1')
  } catch {
    // ignore
  }
}

export function clearEvmWalletDisconnected(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(EVM_WALLET_DISCONNECTED_KEY)
  } catch {
    // ignore
  }
}

export function isEvmWalletDisconnected(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  try {
    return sessionStorage.getItem(EVM_WALLET_DISCONNECTED_KEY) === '1'
  } catch {
    return false
  }
}

export function getSelectedNetwork(): SelectedNetwork | null {
  if (typeof sessionStorage === 'undefined') return null
  const n = sessionStorage.getItem(SELECTED_NETWORK_KEY)
  if (n === 'bsc' || n === 'ethereum' || n === 'bitcoin') return n
  return null
}

export function setSelectedNetwork(network: SelectedNetwork): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(SELECTED_NETWORK_KEY, network)
  } catch {
    // ignore
  }
}

export function isBitcoinWalletDisconnected(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  try {
    return sessionStorage.getItem(BITCOIN_WALLET_DISCONNECTED_KEY) === '1'
  } catch {
    return false
  }
}

export function setBitcoinWalletDisconnected(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(BITCOIN_WALLET_DISCONNECTED_KEY, '1')
  } catch {
    // ignore
  }
}

export function clearBitcoinWalletDisconnected(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(BITCOIN_WALLET_DISCONNECTED_KEY)
  } catch {
    // ignore
  }
}

export function getBitcoinWalletConnection(): { address: string; walletId: string } | null {
  if (typeof sessionStorage === 'undefined') return null
  if (isBitcoinWalletDisconnected()) return null
  try {
    const address = sessionStorage.getItem(BITCOIN_WALLET_ADDRESS_KEY)
    const walletId = sessionStorage.getItem(BITCOIN_WALLET_ID_KEY)
    if (address && walletId && (walletId === 'okx' || walletId === 'unisat')) return { address, walletId }
    return null
  } catch {
    return null
  }
}

export function setBitcoinWalletConnection(address: string, walletId: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    clearBitcoinWalletDisconnected()
    sessionStorage.setItem(BITCOIN_WALLET_ADDRESS_KEY, address)
    sessionStorage.setItem(BITCOIN_WALLET_ID_KEY, walletId)
  } catch {
    // ignore
  }
}

export function clearBitcoinWalletConnection(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    setBitcoinWalletDisconnected()
    sessionStorage.removeItem(BITCOIN_WALLET_ADDRESS_KEY)
    sessionStorage.removeItem(BITCOIN_WALLET_ID_KEY)
  } catch {
    // ignore
  }
}

/** Cache full user info returned from backend sign-in. Stored in sessionStorage JSON. */
export function setAuthUserData(user: unknown): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(user))
  } catch {
    // ignore storage errors (quota, disabled, etc.)
  }
}

/** Read cached user info from sessionStorage (or null if missing/invalid). */
export function getAuthUserData<T = unknown>(): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(AUTH_USER_DATA_KEY)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Clear all auth-related session keys (used on logout). */
export function clearAuthSessionStorage(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_USERNAME_KEY)
    sessionStorage.removeItem(AUTH_ROLE_KEY)
    sessionStorage.removeItem(AUTH_USER_ID_KEY)
    sessionStorage.removeItem(AUTH_USER_DATA_KEY)
    sessionStorage.removeItem(SELECTED_NETWORK_KEY)
    clearBitcoinWalletConnection()
    clearBitcoinWalletDisconnected()
  } catch {
    // ignore
  }
}
