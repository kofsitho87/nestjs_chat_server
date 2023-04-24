import { DynamicModule, Global, Module } from '@nestjs/common';
import { KafkaConfig } from './kafka.message';
import { KafkaCoreService } from './kafka.service';

@Global()
@Module({})
export class KafkaModule {
  static register(kafkaConfig: KafkaConfig): DynamicModule {
    return {
      global: true,
      module: KafkaModule,
      providers: [
        {
          provide: KafkaCoreService,
          useValue: new KafkaCoreService(kafkaConfig),
        },
      ],
      exports: [KafkaCoreService],
    };
  }

  // public static registerAsync(
  //   consumers: string[],
  //   connectOptions: any,
  // ): DynamicModule {
  //   const clients = [];
  //   for (const consumer of consumers) {
  //     clients.push({
  //       provide: consumer,
  //       useFactory: async (
  //         kafkaModuleOptionsProvider: KafkaModuleOptionsProvider,
  //       ) => {
  //         return new KafkaService(
  //           kafkaModuleOptionsProvider.getOptionsByName(consumer),
  //         );
  //       },
  //       inject: [KafkaModuleOptionsProvider],
  //     });
  //   }

  //   const createKafkaProvider = this.createKafkaProvider(
  //     connectOptions,
  //   );

  //   return {
  //     module: KafkaModule,
  //     imports: connectOptions.imports || [],
  //     providers: [
  //       ...createKafkaProvider,
  //       KafkaModuleOptionsProvider,
  //       ...clients,
  //     ],
  //     exports: [...clients],
  //   };
  // }

  // private static createKafkaProvider(options: any): Provider[] {
  //   if (options.useExisting || options.useFactory) {
  //     return [this.createKafkaModuleOptionsProvider(options)];
  //   }
  //   return [this.createKafkaModuleOptionsProvider(options), {
  //     provide: options.useClass,
  //     useClass: options.useClass
  //   }];
  // }

  // private static createKafkaModuleOptionsProvider(
  //   options: any,
  // ): Provider {
  //   if (options.useFactory) {
  //     return {
  //       provide: "KAFKA_MODULE_OPTIONS",
  //       useFactory: options.useFactory,
  //       inject: options.inject || [],
  //     };
  //   }
  //   return {
  //     provide: "KAFKA_MODULE_OPTIONS",
  //     useFactory: async (optionsFactory: KafkaOptionsFactory) =>
  //       await optionsFactory.createKafkaModuleOptions(),
  //     inject: [options.useExisting || options.useClass],
  //   };
  // }
}
