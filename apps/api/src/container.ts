import { LoggingNotifier } from './application/ports/notifications.js';
import type { EmailSender, SmsSender } from './application/ports/notifications.js';
import { NominatimGeocoder, type Geocoder } from './infrastructure/geo/pincodeLocation.js';

/**
 * Composition root — the only place that decides which implementation of a port is used.
 * Everything above it depends on the interface, so swapping the development notifier for
 * queued Gmail sends in Phase 8 is a change to this file alone.
 */
let notifierInstance: (EmailSender & SmsSender) | undefined;

export function notifier(): EmailSender & SmsSender {
  notifierInstance ??= new LoggingNotifier();
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
