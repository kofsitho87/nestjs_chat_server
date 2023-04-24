import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Deserializer } from '@nestjs/microservices';
import { Admin, Consumer, Kafka, Producer, SeekEntry } from 'kafkajs';
import { KafkaResponseDeserializer } from './kafka-response.deserializer';
import {
  SUBSCRIBER_FIXED_FN_REF_MAP,
  SUBSCRIBER_FN_REF_MAP,
  SUBSCRIBER_OBJ_REF_MAP,
} from './kafka.decorator';
import { KafkaConfig } from './kafka.message';

@Injectable()
export class KafkaCoreService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private fixedConsumer: Consumer;
  private admin: Admin;

  private deserializer: Deserializer;

  protected topicOffsets: Map<
    string,
    (SeekEntry & { high: string; low: string })[]
  > = new Map();

  constructor(private kafkaConfig: KafkaConfig) {
    if (process.env.CHAT_ENV == 'LOCAL') {
      return;
    }

    this.kafka = new Kafka({
      clientId: this.kafkaConfig.clientId,
      brokers: this.kafkaConfig.brokers,
      ssl: this.kafkaConfig.ssl,
      retry: {
        initialRetryTime: 3000,
        retries: 1,
      },
    });

    this.admin = this.kafka.admin();
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: this.kafkaConfig.groupId,
      retry: {
        initialRetryTime: 3000,
        retries: 1,
      },
    });

    this.initializeDeserializer();
  }

  async onModuleInit(): Promise<void> {
    if (process.env.CHAT_ENV == 'LOCAL') {
      return;
    }

    await this.connect();
    await this.getTopicOffsets();

    SUBSCRIBER_FN_REF_MAP.forEach((functionRef, topic) => {
      this.subscribe(topic);
    });
    // if (SUBSCRIBER_FN_REF_MAP.keys.length > 0) {
    //   this.bindAllTopicToConsumer();
    // }
    this.bindAllTopicToConsumer();
  }

  protected initializeDeserializer(): void {
    this.deserializer = new KafkaResponseDeserializer();
  }

  private async getTopicOffsets(): Promise<void> {
    const topics = SUBSCRIBER_FN_REF_MAP.keys();

    for await (const topic of topics) {
      try {
        const topicOffsets = await this.admin.fetchTopicOffsets(topic);
        this.topicOffsets.set(topic, topicOffsets);
      } catch (e) {
        throw e;
        // this.logger.error('Error fetching topic offset: ', topic);
      }
    }
  }

  private async subscribe(topic: string): Promise<void> {
    await this.consumer.subscribe({
      topic,
      fromBeginning: false,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async connect() {
    await this.producer.connect();
    await this.consumer.connect();
    // await this.fixedConsumer.connect();
  }

  async disconnect() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    // await this.fixedConsumer.disconnect();
  }

  async bindAllTopicToConsumer() {
    this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const callback = SUBSCRIBER_FN_REF_MAP.get(topic);
        const object = SUBSCRIBER_OBJ_REF_MAP.get(topic);
        // const { timestamp, response, offset, key } = await this.deserializer.deserialize(message, { topic });
        // callback.call(object, [response, key, offset, timestamp, partition]);
        await callback.apply(object, [JSON.parse(message.value.toString())]);
      },
    });
  }

  async bindAllTopicToFixedConsumer(callback, _topic) {
    await this.fixedConsumer.subscribe({ topic: _topic, fromBeginning: false });
  }

  subscribeToResponseOf<T>(topic: string, instance: T): void {
    SUBSCRIBER_OBJ_REF_MAP.set(topic, instance);
  }

  // async sendMessage(kafkaTopic: string, kafkaMessage: SendPushPayload) {
  async sendMessage(kafkaTopic: string, kafkaMessage: any) {
    const metadata = await this.producer
      .send({
        topic: kafkaTopic,
        messages: [
          {
            value: JSON.stringify(kafkaMessage),
            key: new Date().getTime().toString(),
            // partition: 0,
          },
        ],
      })
      .catch((e) => console.error(e.message, e));
    return metadata;
  }
}
