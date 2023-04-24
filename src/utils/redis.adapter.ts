import { createAdapter } from 'socket.io-redis';
import { RedisClient } from 'redis';
import { SocketIoAdapter } from '@/utils/socket-io.adapter';

export class RedisIoAdapter extends SocketIoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);

    const pubClient = new RedisClient({
      host: process.env.REDIS_HOST,
      port: 6379,
    });
    const subClient = pubClient.duplicate();
    const redisAdapter = createAdapter({ pubClient, subClient });
    server.adapter(redisAdapter);
    // console.log(server);

    return server;
  }
}
