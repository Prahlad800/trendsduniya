import dns from 'node:dns';
import net from 'node:net';
import env from './env.js';

// Use the configured resolvers for both SRV discovery and socket hostname lookups.
// dns.setServers alone does not change Windows' dns.lookup resolver.
export function mongoConnectionOptions() {
  const options = { serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000, maxPoolSize: 10 };
  if (!env.mongoDnsServers.length) return options;
  dns.setServers(env.mongoDnsServers);
  const resolver = new dns.Resolver({ timeout: 4000, tries: 2 });
  resolver.setServers(env.mongoDnsServers);
  const cache = new Map();
  options.family = 4;
  options.lookup = (hostname, lookupOptions, callback) => {
    const all = typeof lookupOptions === 'object' && lookupOptions.all;
    const finish = (addresses) => all ? callback(null, addresses.map(address => ({ address, family: 4 }))) : callback(null, addresses[0], 4);
    if (net.isIPv4(hostname)) return finish([hostname]);
    const hit = cache.get(hostname);
    if (hit && hit.until > Date.now()) return finish(hit.addresses);
    resolver.resolve4(hostname, { ttl: true }, (error, records) => {
      if (error || !records?.length) return callback(error || new Error('MongoDB hostname has no IPv4 records'));
      const addresses = records.map(record => record.address);
      cache.set(hostname, { addresses, until: Date.now() + Math.min(60, ...records.map(r => r.ttl)) * 1000 });
      finish(addresses);
    });
  };
  return options;
}
