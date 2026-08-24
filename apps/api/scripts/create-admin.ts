/**
 * Creates the first administrator, or promotes an existing account to one.
 *
 *   pnpm create:admin -- --email you@example.com --phone 9876543210 --name "Your Name"
 *
 * Nothing else in the system can do this, and deliberately so: an endpoint that mints
 * administrators is an endpoint someone will eventually reach. Every other admin is created
 * by an admin, which means the first one has to come from the command line, run by whoever
 * already has the database credentials.
 *
 * The account is created fully verified — there is no inbox to check on a server.
 *
 * The password is read from the terminal, never from an argument: `--password` would end up
 * in shell history and in the process list where anyone with `ps` can read it. For an
 * unattended provisioning step, set `ADMIN_PASSWORD` in the environment instead — a
 * variable is visible to the process's owner rather than to every user on the box.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../src/infrastructure/db/mongo.js';
import { UserModel } from '../src/infrastructure/db/models/User.js';
import { hashPassword } from '../src/infrastructure/auth/password.js';
import { PASSWORD_MIN_LENGTH, emailSchema, phoneSchema } from '@locatex/contracts';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

/** Asked twice, because a typo here locks the only administrator out of the dashboard. */
async function askForPassword(rl: ReturnType<typeof createInterface>): Promise<string> {
  const password = await rl.question(`Password (at least ${PASSWORD_MIN_LENGTH} characters): `);
  const again = await rl.question('Type it again: ');
  if (password !== again) throw new Error('The two passwords do not match.');
  return password;
}

async function main(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const email = emailSchema.parse(argument('email') ?? (await rl.question('Email address: ')));
    const phone = phoneSchema.parse(argument('phone') ?? (await rl.question('Mobile number: ')));
    const fullName = (argument('name') ?? (await rl.question('Full name: '))).trim();

    if (fullName.length < 2) throw new Error('A full name is required.');

    await connectMongo();

    const existing = await UserModel.findOne({
      deletedAt: null,
      $or: [{ email }, { phone }],
    });

    if (existing) {
      if (existing.role === 'admin') {
        console.warn(`\n${existing.email} is already an administrator. Nothing to do.`);
        return;
      }

      const confirm = process.env.ADMIN_PROMOTE === 'yes' ? 'y' : await rl.question(
        `\n${existing.email} already exists as a ${existing.role}. Promote to administrator? [y/N] `,
      );
      if (confirm.trim().toLowerCase() !== 'y') {
        console.warn('Left alone.');
        return;
      }

      existing.role = 'admin';
      // Every session in flight carries the old role; raising this forces a fresh token.
      existing.tokenVersion += 1;
      await existing.save();
      console.warn(`\n${existing.email} is now an administrator. They must sign in again.`);
      return;
    }

    const password = process.env.ADMIN_PASSWORD ?? (await askForPassword(rl));
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`The password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
    }

    const now = new Date();
    const created = await UserModel.create({
      fullName,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role: 'admin',
      status: 'active',
      // Verified on creation: there is no inbox or handset to check from a server, and the
      // account cannot sign in until both channels are confirmed.
      emailVerifiedAt: now,
      phoneVerifiedAt: now,
    });

    console.warn(`\nAdministrator created: ${created.email}`);
    console.warn('Sign in at /admin. Change this password from your profile afterwards.');
  } finally {
    rl.close();
    if (mongoose.connection.readyState === 1) await disconnectMongo();
  }
}

await main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
