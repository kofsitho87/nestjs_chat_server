import { INestApplicationContext } from '@nestjs/common';
import { isFunction, isNil } from '@nestjs/common/utils/shared.utils';
import {
  AbstractWsAdapter,
  MessageMappingProperties,
} from '@nestjs/websockets';
import { DISCONNECT_EVENT } from '@nestjs/websockets/constants';
import { fromEvent, Observable } from 'rxjs';
import { filter, first, map, mergeMap, share, takeUntil } from 'rxjs/operators';
import { Server } from 'socket.io';

import { createAdapter } from '@/utils/socket.io-redis';
import { RedisClient } from 'redis';
import { instrument } from '@socket.io/admin-ui';

export class SocketIoAdapter extends AbstractWsAdapter {
  constructor(
    appOrHttpServer?: INestApplicationContext | any,
    private readonly corsOrigins = [],
  ) {
    super(appOrHttpServer);
  }

  public create(
    port: number,
    options?: any & { namespace?: string; server?: any },
  ): any {
    if (!options) {
      return this.createIOServer(port);
    }
    const { namespace, server, ...opt } = options;
    return server && isFunction(server.of)
      ? server.of(namespace)
      : namespace
      ? this.createIOServer(port, opt).of(namespace)
      : this.createIOServer(port, opt);
  }

  public createIOServer(port: number, options?: any): any {
    const pubClient = new RedisClient({
      host: process.env.REDIS_HOST,
      port: 6379,
    });
    const subClient = pubClient.duplicate();
    const redisAdapter = createAdapter({ pubClient, subClient });
    if (this.httpServer && port === 0) {
      const s = new Server(this.httpServer, {
        cors: {
          origin: options || '*',
          methods: ['GET', 'POST'],
          credentials: true,
          allowedHeaders: ['Content-Type', 'authorization'],
        },
        cookie: false,
        // Allow 1MB of data per request.
        maxHttpBufferSize: 1e6,
      });
      instrument(s, {
        // namespaceName: "/",
        auth: {
          type: 'basic',
          username: 'admin',
          password:
            '$2b$10$IGfiDyw/8k6hZ9NUbf3Tq.FN5rypo8fezFiX9JADpg65uB.OiEMt6', //kofsitho
        },
      });

      s.adapter(redisAdapter);
      return s;
    }
    const s = new Server(port, options);
    s.adapter(redisAdapter);
    return s;
  }

  public bindMessageHandlers(
    client: any,
    handlers: MessageMappingProperties[],
    transform: (data: any) => Observable<any>,
  ) {
    const disconnect$ = fromEvent(client, DISCONNECT_EVENT).pipe(
      share(),
      first(),
    );

    handlers.forEach(({ message, callback }) => {
      const source$ = fromEvent(client, message).pipe(
        mergeMap((payload: any) => {
          const { data, ack } = this.mapPayload(payload);
          return transform(callback(data, ack)).pipe(
            filter((response: any) => !isNil(response)),
            map((response: any) => [response, ack]),
          );
        }),
        takeUntil(disconnect$),
      );
      source$.subscribe(([response, ack]) => {
        if (response.event) {
          return client.emit(response.event, response.data);
        }
        isFunction(ack) && ack(response);
      });
    });
  }

  public mapPayload(payload: any): { data: any; ack?: () => void } {
    if (!Array.isArray(payload)) {
      return { data: payload };
    }
    const lastElement = payload[payload.length - 1];
    const isAck = isFunction(lastElement);
    if (isAck) {
      const size = payload.length - 1;
      return {
        data: size === 1 ? payload[0] : payload.slice(0, size),
        ack: lastElement,
      };
    }
    return { data: payload };
  }
}
