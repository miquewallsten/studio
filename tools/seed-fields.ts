import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

/**
 * Example fields showing dynamic & composite and attached validations.
 * You already have a `fields` collection; we upsert a few examples.
 */
function init() {
  if (!getApps().length) initializeApp();
  return getFirestore();
}

async function main() {
  const db = init();
  const batch = db.batch();

  const examples = [
    {
      id: 'person.full_name',
      label: 'Full Name',
      type: 'text',
      required: true,
      validations: [
        { validatorId: 'namescan.pep_screening', level: 'soft' },
      ],
      ui: { placeholder: 'e.g., Juan Pérez' }
    },
    {
      id: 'person.curp',
      label: 'CURP',
      type: 'text',
      required: true,
      validations: [
        { validatorId: 'curp.lookup', level: 'hard' },
      ],
      ui: { mask: 'CURP' }
    },
    {
      id: 'person.rfc',
      label: 'RFC',
      type: 'text',
      required: true,
      validations: [
        { validatorId: 'rfc_sat.lookup', level: 'soft' },
      ],
      ui: { mask: 'RFC' }
    },
    {
      id: 'doc.signature_id',
      label: 'ZapSign Document ID',
      type: 'text',
      required: false,
      validations: [
        { validatorId: 'zapsign.doc_signature', level: 'soft' },
      ],
    },
    {
      id: 'person.identity',
      label: 'Identity (Composite)',
      type: 'composite',
      compositeOf: ['person.full_name', 'person.curp', 'person.rfc'],
      required: true,
    }
  ];

  for (const f of examples) {
    const ref = db.collection('fields').doc(f.id);
    batch.set(ref, f, { merge: true });
  }
  await batch.commit();
  console.log(`Upserted ${examples.length} field definitions`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
