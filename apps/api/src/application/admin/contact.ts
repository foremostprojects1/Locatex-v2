import { contactMessageSchema, type ContactMessageInput } from '@locatex/contracts';
import { ContactMessageModel } from '../../infrastructure/db/models/ContactMessage.js';
import { UserModel } from '../../infrastructure/db/models/User.js';
import { AppError } from '../../shared/AppError.js';
import type { EmailSender } from '../ports/notifications.js';

/**
 * Someone writes in.
 *
 * The record is written first and the emails follow. v1 only emailed, so a message that
 * landed in a spam folder was gone; here the dashboard is the system of record and the mail
 * is a nudge towards it. A failed send is therefore logged and swallowed rather than turned
 * into an error the sender sees — their message *was* received.
 */
export async function receiveContactMessage(
  input: ContactMessageInput,
  context: { userId?: string | null; ip?: string | null; userAgent?: string | null },
  email: EmailSender,
): Promise<{ id: string }> {
  const data = contactMessageSchema.parse(input);

  const record = await ContactMessageModel.create({
    ...data,
    phone: data.phone ?? null,
    propertyId: data.propertyId ?? null,
    userId: context.userId ?? null,
    ip: context.ip ?? null,
    userAgent: context.userAgent ?? null,
  });

  const admins = await UserModel.find({ role: 'admin', status: 'active', deletedAt: null })
    .select('email fullName')
    .lean();

  await Promise.allSettled([
    ...admins.map((admin) =>
      email.send({
        to: admin.email,
        template: 'contact-received',
        data: {
          fullName: admin.fullName,
          messageId: record.id,
          from: data.name,
          subject: data.subject,
          preview: data.message.slice(0, 200),
        },
      }),
    ),
    // The sender gets an acknowledgement so they know it arrived and are not left guessing.
    email.send({
      to: data.email,
      template: 'contact-acknowledged',
      data: { fullName: data.name, subject: data.subject },
    }),
  ]);

  return { id: record.id };
}

export async function setContactStatus(
  messageId: string,
  adminId: string,
  status: 'new' | 'read' | 'replied' | 'closed',
  note: string | undefined,
): Promise<void> {
  const message = await ContactMessageModel.findById(messageId);
  if (!message) throw AppError.notFound('Message');

  message.status = status;
  message.handledBy = adminId;
  message.handledAt = new Date();
  if (note !== undefined) message.adminNote = note;
  await message.save();
}
