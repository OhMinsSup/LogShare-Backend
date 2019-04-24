import * as dotenv from 'dotenv';
import * as redis from 'redis';
dotenv.config();

class RedisClient {
  client: null | redis.RedisClient;
  connectedTime: null | number;

  constructor() {
    this.client = null;
    this.connectedTime = null;
  }
  get connected() {
    if (!this.client) return false;
    return this.client.connected;
  }
  connect() {
    const p = new Promise((resolve, reject) => {
      const client = redis.createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASS,
      });
      client.on('error', err => {
        console.log('Redis Error: ', err);
        reject(err);
      });
      client.on('ready', () => {
        this.connectedTime = Date.now();
        console.log('Redis is ready ✅');
        resolve();
      });
      this.client = client;
    });
    return p;
  }
  async remove(key: string) {
    if (!this.connected || !this.client) {
      await this.connect();
    }
    if (!this.client) return;
    this.client.del(key);
    console.log('removing key %s', key);
  }
  async flushall() {
    if (!this.connected || !this.client) {
      await this.connect();
    }
    if (!this.client) return;
    return this.client.flushall();
  }
  async set(key: string, value: string, mode: 'PX' | 'EX', duration: number) {
    if (!this.connected || !this.client) {
      await this.connect();
    }
    return new Promise((resolve, reject) => {
      if (!this.client) return reject();
      this.client.set(key, value, mode, duration, (err, reply) => {
        if (err) {
          return reject(err);
        }
        resolve(reply);
      });
    });
  }
  async get(key: string) {
    if (!this.connected || !this.client) {
      await this.connect();
    }
    return new Promise((resolve, reject) => {
      if (!this.client) return reject();
      this.client.get(key, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  }

  async setCache(key: string, value: string, duraion: number) {
    if (!this.connected) {
      await this.connect();
    }
    const p = new Promise((resolve, reject) => {
      if (!this.connected || !this.client) {
        reject(new Error('redis not connected'));
        return;
      }
      this.client.set(key, value, 'EX', duraion, (err, reply) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(reply);
      });
    });
    return p;
  }

  async getCache(key: string) {
    if (!this.connected) {
      await this.connect();
    }
    const p = new Promise((resolve, reject) => {
      if (!this.connected || !this.client) {
        reject(new Error('redis not connected'));
        return;
      }
      this.client.get(key, (err, reply) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(reply);
      });
    });
    return p;
  }
}

const redisClient = new RedisClient();

export default redisClient;
