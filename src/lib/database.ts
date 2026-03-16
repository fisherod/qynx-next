// =================================
// 🗄️ MySQL Database Layer
// =================================

import mysql from "mysql2/promise";
import {
  Payment,
  PaymentEvent,
  WebhookLog,
  CreatePaymentRequest,
  PaymentStatus,
  ChainType,
  AdminWalletBalance
} from "@/types";
import { logInfo, logError } from "./logger";

class Database {
  private pool: mysql.Pool | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Start initialization but don't wait for it
    this.initPromise = this.init();
  }

  private async init() {
    try {
      const config = {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "db_midpay",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      };

      this.pool = mysql.createPool({
        ...config,
        // Set timezone to UTC for all connections
        timezone: "Z" // UTC
      });

      // Test connection and set timezone
      const connection = await this.pool.getConnection();
      await connection.ping();
      // Ensure UTC timezone for this connection
      await connection.query("SET time_zone = '+00:00'");
      connection.release();

      this.isInitialized = true;

      logInfo("✅ MySQL Database initialized successfully");
    } catch (error) {
      logError("❌ Database initialization failed", error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      if (this.initPromise) {
        await this.initPromise;
      } else {
        await this.init();
      }
    }
  }

  // Helper methods for query execution
  private async query(sql: string, params?: any[]): Promise<any> {
    await this.ensureInitialized();
    if (!this.pool) throw new Error("Database not initialized");
    const connection = await this.pool.getConnection();
    try {
      // Ensure UTC timezone for this connection
      await connection.query("SET time_zone = '+00:00'");
      const [rows] = await connection.execute(sql, params || []);
      return rows;
    } finally {
      connection.release();
    }
  }

  private async execute(sql: string, params?: any[]): Promise<any> {
    await this.ensureInitialized();
    if (!this.pool) throw new Error("Database not initialized");
    const connection = await this.pool.getConnection();
    try {
      // Ensure UTC timezone for this connection
      await connection.query("SET time_zone = '+00:00'");
      const [result] = await connection.execute(sql, params || []);
      return result;
    } finally {
      connection.release();
    }
  }

  // Payment operations
  async createPayment(data: CreatePaymentRequest & { payment_id: string; expires_at: Date }): Promise<Payment> {
    const { payment_id, service_name, description, amount, webhook_url, language, expires_at } = data;

    // Format expires_at as UTC datetime string for MySQL
    // toISOString() returns UTC, we format it as MySQL DATETIME (YYYY-MM-DD HH:mm:ss)
    // Since we set session timezone to UTC, MySQL will interpret this correctly
    const expiresAtMySQL = expires_at.toISOString().slice(0, 19).replace("T", " ");

    await this.execute(
      `INSERT INTO payments (
        payment_id, service_name, description,
        amount, webhook_url, language, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [payment_id, service_name, description || null, amount, webhook_url || null, language || null, expiresAtMySQL]
    );

    const payments = await this.query("SELECT * FROM payments WHERE payment_id = ?", [payment_id]);

    const payment = Array.isArray(payments) && payments.length > 0 ? (payments[0] as Payment) : null;
    if (!payment) {
      throw new Error(`Failed to create payment: payment not found after insert`);
    }

    await this.logEvent(payment_id, "created", { amount });

    return payment;
  }

  async getPayment(paymentId: string): Promise<Payment | null> {
    const rows = await this.query("SELECT * FROM payments WHERE payment_id = ?", [paymentId]);
    return Array.isArray(rows) && rows.length > 0 ? (rows[0] as Payment) : null;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    data?: { wallet_address?: string; tx_hash?: string }
  ): Promise<void> {
    let sql = "UPDATE payments SET status = ?, updated_at = NOW()";
    const params: any[] = [status];

    if (data?.wallet_address) {
      sql += ", wallet_address = ?";
      params.push(data.wallet_address);
    }

    if (data?.tx_hash) {
      sql += ", tx_hash = ?";
      params.push(data.tx_hash);
    }

    sql += " WHERE payment_id = ?";
    params.push(paymentId);

    await this.execute(sql, params);
    await this.logEvent(paymentId, "status_updated", { status, ...data });
  }

  async updatePaymentChain(paymentId: string, chain: ChainType): Promise<void> {
    await this.execute("UPDATE payments SET chain = ?, updated_at = NOW() WHERE payment_id = ?", [chain, paymentId]);
    await this.logEvent(paymentId, "chain_updated", { chain });
  }

  async getExpiredPayments(): Promise<Payment[]> {
    const rows = await this.query(
      `SELECT * FROM payments 
      WHERE status = 'pending' AND expires_at < NOW()`
    );
    return Array.isArray(rows) ? (rows as Payment[]) : [];
  }

  async markExpiredPayments(): Promise<number> {
    const [result] = await this.execute(
      `UPDATE payments 
      SET status = 'expired', updated_at = NOW()
      WHERE status = 'pending' AND expires_at < NOW()`
    );
    return (result as any).affectedRows || 0;
  }

  // Event logging
  async logEvent(paymentId: string, eventType: string, data?: any): Promise<void> {
    await this.execute(`INSERT INTO payment_events (payment_id, event_type, data) VALUES (?, ?, ?)`, [
      paymentId,
      eventType,
      data ? JSON.stringify(data) : null
    ]);
  }

  async getPaymentEvents(paymentId: string): Promise<PaymentEvent[]> {
    const rows = await this.query("SELECT * FROM payment_events WHERE payment_id = ? ORDER BY created_at DESC", [
      paymentId
    ]);
    return Array.isArray(rows) ? (rows as PaymentEvent[]) : [];
  }

  // Webhook operations
  async logWebhook(
    paymentId: string,
    webhookUrl: string,
    payload: any,
    responseStatus: number,
    responseData?: any
  ): Promise<void> {
    await this.execute(
      `INSERT INTO webhook_logs (payment_id, webhook_url, payload, response_status, response_data)
       VALUES (?, ?, ?, ?, ?)`,
      [
        paymentId,
        webhookUrl,
        JSON.stringify(payload),
        responseStatus,
        responseData ? JSON.stringify(responseData) : null
      ]
    );
  }

  async getWebhookLogs(paymentId: string): Promise<WebhookLog[]> {
    const rows = await this.query("SELECT * FROM webhook_logs WHERE payment_id = ? ORDER BY created_at DESC", [
      paymentId
    ]);
    return Array.isArray(rows) ? (rows as WebhookLog[]) : [];
  }

  // Admin operations
  async getPaymentCount(): Promise<{ total: number }> {
    const rows = await this.query("SELECT COUNT(*) as total FROM payments");
    return { total: Array.isArray(rows) && rows.length > 0 ? (rows[0] as any).total || 0 : 0 };
  }

  async getAllPayments(limit: number, offset: number): Promise<Payment[]> {
    const rows = await this.query("SELECT * FROM payments ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
    return Array.isArray(rows) ? (rows as Payment[]) : [];
  }

  async getUniqueWalletAddresses(): Promise<{ address: string; chain: string | null }[]> {
    const [rows] = await this.query(
      "SELECT DISTINCT wallet_address as address, chain FROM payments WHERE wallet_address IS NOT NULL AND wallet_address != '' ORDER BY chain, address"
    );
    return rows as { address: string; chain: string | null }[];
  }

  // Analytics and reporting
  async getPaymentStats(days = 30): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    totalAmount: number;
  }> {
    const [rows] = await this.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as totalAmount
      FROM payments 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    const stats = (rows as any[])[0] || {};
    return {
      total: stats.total || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
      pending: stats.pending || 0,
      totalAmount: stats.totalAmount || 0
    };
  }

  async getWalletPaymentStats(
    walletAddress: string,
    chain: string
  ): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    totalAmount: number;
    lastPaymentDate: string | null;
  }> {
    const [rows] = await this.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as totalAmount,
        MAX(created_at) as lastPaymentDate
      FROM payments 
      WHERE wallet_address = ? AND chain = ?`,
      [walletAddress, chain]
    );

    const stats = (rows as any[])[0] || {};
    return {
      total: stats.total || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
      pending: stats.pending || 0,
      totalAmount: stats.totalAmount || 0,
      lastPaymentDate: stats.lastPaymentDate || null
    };
  }

  async getWalletBalances(): Promise<AdminWalletBalance[]> {
    const rows = await this.query(
      `SELECT 
        address,
        chain,
        usdt_balance as usdtBalance,
        amount,
        payment_count as paymentCount,
        connected_at as connectedAt,
        last_activity as lastActivity,
        status
      FROM wallets 
      ORDER BY connected_at DESC`
    );

    const wallets = Array.isArray(rows) ? rows : [];
    return wallets.map((wallet: any) => ({
      address: wallet.address,
      chain: wallet.chain,
      balance: "0.00",
      usdtBalance: wallet.usdtBalance || "0.00",
      amount: wallet.amount || "0.00",
      paymentCount: wallet.paymentCount || 0,
      lastActivity: wallet.lastActivity || wallet.connectedAt || new Date().toISOString()
    }));
  }

  async saveWallet(walletData: {
    address: string;
    chain: string;
    amount?: string;
    usdtBalance?: string;
  }): Promise<void> {
    await this.execute(
      `INSERT INTO wallets (
        address, 
        chain, 
        usdt_balance, 
        amount,
        connected_at, 
        last_activity, 
        payment_count, 
        status
      )
      VALUES (?, ?, ?, ?, NOW(), NOW(), 1, 'active')
      ON DUPLICATE KEY UPDATE
        usdt_balance = VALUES(usdt_balance),
        amount = VALUES(amount),
        last_activity = NOW(),
        payment_count = payment_count + 1`,
      [walletData.address, walletData.chain, walletData.usdtBalance || "0.00", walletData.amount || "0.00"]
    );

    logInfo(`Wallet ${walletData.address} on ${walletData.chain} saved/updated`);
  }

  async getWalletByAddress(address: string): Promise<any | null> {
    const rows = await this.query("SELECT * FROM wallets WHERE address = ?", [address]);
    const wallets = Array.isArray(rows) ? rows : [];
    return wallets[0] || null;
  }

  async updateWalletBalance(address: string, usdtBalance: string): Promise<void> {
    await this.execute(
      `UPDATE wallets 
      SET usdt_balance = ?, last_activity = NOW()
      WHERE address = ?`,
      [usdtBalance, address]
    );

    logInfo(`Wallet ${address} balance updated to ${usdtBalance} USDT`);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
    }
  }

  // Auto-transfer methods
  async recordTransfer(transferData: {
    success: boolean;
    txHash?: string;
    error?: string;
    amount: string;
    from: string;
    to: string;
    chain: string;
    timestamp: Date;
  }): Promise<void> {
    try {
      await this.execute(
        `INSERT INTO auto_transfers (
          from_address, to_address, amount, chain, tx_hash, success, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transferData.from,
          transferData.to,
          transferData.amount,
          transferData.chain,
          transferData.txHash || null,
          transferData.success ? 1 : 0,
          transferData.error || null,
          transferData.timestamp.toISOString().slice(0, 19).replace("T", " ")
        ]
      );

      logInfo("Auto-transfer recorded successfully", transferData);
    } catch (error) {
      logError("Failed to record auto-transfer", error);
      throw error;
    }
  }

  async getAutoTransferConfig(): Promise<Record<string, string>> {
    try {
      const rows = await this.query("SELECT `key`, value FROM auto_transfer_config");
      const config: Record<string, string> = {};
      const configs = Array.isArray(rows) ? rows : [];

      configs.forEach((row: any) => {
        config[row.key] = row.value;
      });

      return config;
    } catch (error) {
      logError("Failed to get auto-transfer config", error);
      throw error;
    }
  }

  async updateAutoTransferConfig(key: string, value: string): Promise<void> {
    try {
      await this.execute(
        `UPDATE auto_transfer_config 
        SET value = ?, updated_at = NOW() 
        WHERE key = ?`,
        [value, key]
      );

      logInfo(`Auto-transfer config updated: ${key} = ${value}`);
    } catch (error) {
      logError("Failed to update auto-transfer config", error);
      throw error;
    }
  }

  async getAutoTransferHistory(limit: number = 100, offset: number = 0): Promise<any[]> {
    try {
      const rows = await this.query(
        `SELECT * FROM auto_transfers 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      logError("Failed to get auto-transfer history", error);
      throw error;
    }
  }

  // Treasury Wallet Management
  async getTreasuryWallets(): Promise<any[]> {
    try {
      const rows = await this.query(
        `SELECT * FROM treasury_wallets 
        ORDER BY chain, created_at DESC`
      );
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      logError("Failed to get treasury wallets", error);
      throw error;
    }
  }

  async getTreasuryWallet(chain: string): Promise<any | null> {
    try {
      const rows = await this.query(
        `SELECT * FROM treasury_wallets 
        WHERE chain = ? AND is_active = 1
        ORDER BY created_at DESC
        LIMIT 1`,
        [chain]
      );
      const wallets = Array.isArray(rows) ? rows : [];
      return wallets[0] || null;
    } catch (error) {
      logError(`Failed to get treasury wallet for ${chain}`, error);
      throw error;
    }
  }

  async saveTreasuryWallet(chain: string, address: string, name?: string, description?: string): Promise<any> {
    try {
      // First, deactivate any existing wallets for this chain
      await this.execute(
        `UPDATE treasury_wallets 
        SET is_active = 0, updated_at = NOW() 
        WHERE chain = ?`,
        [chain]
      );

      // Then insert or update the new wallet
      await this.execute(
        `INSERT INTO treasury_wallets 
        (chain, address, name, description, is_active, updated_at) 
        VALUES (?, ?, ?, ?, 1, NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          description = VALUES(description),
          is_active = 1,
          updated_at = NOW()`,
        [
          chain,
          address,
          name || `${chain.toUpperCase()} Treasury`,
          description || `Default ${chain.toUpperCase()} treasury wallet`
        ]
      );

      // Get the saved wallet data
      const rows = await this.query(
        `SELECT * FROM treasury_wallets WHERE chain = ? AND address = ? AND is_active = 1`,
        [chain, address]
      );
      const wallets = Array.isArray(rows) ? rows : [];

      logInfo(`Treasury wallet saved for ${chain}: ${address}`);
      return wallets[0];
    } catch (error) {
      logError(`Failed to save treasury wallet for ${chain}`, error);
      throw error;
    }
  }

  async deleteTreasuryWallet(id: number): Promise<void> {
    try {
      await this.execute(`DELETE FROM treasury_wallets WHERE id = ?`, [id]);
      logInfo(`Treasury wallet deleted: ${id}`);
    } catch (error) {
      logError(`Failed to delete treasury wallet: ${id}`, error);
      throw error;
    }
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

// Standalone function for getting wallet balances
export async function getWalletBalances(): Promise<AdminWalletBalance[]> {
  const db = getDatabase();
  return await db.getWalletBalances();
}

export default Database;
