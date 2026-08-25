import { LoggingNotifier } from './application/ports/notifications.js';
import type { EmailSender, SmsSender } from './application/ports/notifications.js';
import { QueuedMailer } from './application/mail/mailer.js';
import { NominatimGeocoder, type Geocoder } from './infrastructure/geo/pincodeLocation.js';
import {
  InMemoryDocumentStorage,
  type DocumentStorage,
} from './application/ports/documentStorage.js';
import { GoogleDriveStorage } from './infrastructure/storage/googleDrive.js';
import { env } from './config/env.js';

/**
 * Composition root — the only place that decides which implementation of a port is used.
 * Everything above it depends on the interface, so swapping the development notifier for
 * queued Gmail sends in Phase 8 is a change to this file alone.
 */
let notifierInstance: (EmailSender & SmsSender) | undefined;

/**
 * Email goes through the queue; SMS still has no provider (see the Phase 2 note), so the
 * logging sender covers it. They are one object because every use case takes one notifier.
 */
class Notifier implements EmailSender, SmsSender {
  private readonly mailer = new QueuedMailer();
  private readonly sms = new LoggingNotifier();

  async send(message: Parameters<EmailSender['send']>[0] | Parameters<SmsSender['send']>[0]): Promise<void> {
    if (message.template === 'phone-otp') {
      return this.sms.send(message as Parameters<SmsSender['send']>[0]);
    }
    return this.mailer.send(message as Parameters<EmailSender['send']>[0]);
  }
}

export function notifier(): EmailSender & SmsSender {
  notifierInstance ??= new Notifier();
  return notifierInstance;
}

/** Tests substitute their own, then reset. */
export function setNotifier(instance: (EmailSender & SmsSender) | undefined): void {
  notifierInstance = instance;
}

let geocoderInstance: Geocoder | undefined;

export function geocoder(): Geocoder {
  geocoderInstance ??= new NominatimGeocoder();
  return geocoderInstance;
}

/** Tests substitute a stub, so no suite ever calls a public geocoding service. */
export function setGeocoder(instance: Geocoder | undefined): void {
  geocoderInstance = instance;
}

/**
 * Document storage.
 *
 * Chosen by configuration rather than by `NODE_ENV`: a staging box may deliberately keep
 * documents in memory, and development should not need a Google account to run the wizard.
 */
let storageInstance: DocumentStorage | undefined;

export function documentStorage(): DocumentStorage {
  storageInstance ??= env().GOOGLE_CLIENT_ID
    ? new GoogleDriveStorage()
    : new InMemoryDocumentStorage();
  return storageInstance;
}

/** Tests substitute the in-memory implementation, then reset. */
export function setDocumentStorage(instance: DocumentStorage | undefined): void {
  storageInstance = instance;
}
