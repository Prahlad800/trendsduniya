// Disposable browser fixture: no production accounts, credentials or database writes.
// Build admin first, run this script, then sign in at the printed URL with
// expiry@example.test / Temporary-test-123. The access token lasts 20 seconds.
import express from 'express';
import mongoose from 'mongoose';
import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import net from 'node:net';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import env from '../src/config/env.js';
import Admin from '../src/models/Admin.js';

const db=await MongoMemoryReplSet.create({replSet:{count:1},binary:{version:'7.0.14'}});
env.mongoUri=db.getUri();
env.accessSecret=randomBytes(32).toString('hex');
env.refreshSecret=randomBytes(32).toString('hex');
await mongoose.connect(env.mongoUri);
await Admin.create({name:'Expiry audit',email:'expiry@example.test',password:'Temporary-test-123',role:'superadmin'});
const fixture=express();
fixture.use((req,res,next)=>{
  const send=res.json.bind(res);
  res.json=payload=>{
    if(req.path==='/api/auth/login'&&payload.data?.accessToken){
      const {id,sid}=jwt.decode(payload.data.accessToken);
      payload.data.accessToken=jwt.sign({id,sid},env.accessSecret,{expiresIn:20,audience:'trendsduniya-admin',issuer:'trendsduniya'});
    }
    return send(payload);
  };
  next();
});
fixture.use(app);
const server=fixture.listen(0,'127.0.0.1');await once(server,'listening');
const portServer=net.createServer().listen(0,'127.0.0.1');await once(portServer,'listening');
const port=portServer.address().port;await new Promise(resolve=>portServer.close(resolve));
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{
  cwd:fileURLToPath(new URL('../../admin/',import.meta.url)),
  env:{...process.env,NODE_ENV:'production',API_URL:`http://127.0.0.1:${server.address().port}/api`},
  stdio:['ignore','pipe','pipe'],windowsHide:true,
});
child.stdout.on('data',b=>{if(b.toString().includes('Ready'))console.log(`EXPIRY_BROWSER_URL http://localhost:${port}/login`);});
child.stderr.on('data',b=>process.stderr.write(b));
let closing=false;
async function cleanup(){
  if(closing)return;closing=true;
  if(child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}
  await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();await db.stop();
}
process.on('SIGINT',()=>cleanup().then(()=>process.exit()));
process.on('SIGTERM',()=>cleanup().then(()=>process.exit()));
// Bound the fixture's lifetime even if its terminal is abandoned.
setTimeout(()=>cleanup().then(()=>process.exit()),5*60*1000).unref();
