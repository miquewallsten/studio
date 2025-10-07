import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';

function init() {
  if (!getApps().length) initializeApp();
  return getFirestore();
}

/**
 * We keep a registry collection for discoverability / admin toggles:
 *   validators/{id} => { id, label, enabled, vendor, docsUrl }
 */
async function main() {
  const db = init();
  const batch = db.batch();

  const items = [
    { id: 'namescan.pep_screening', label: 'NameScan – PEP/Watchlists', vendor: 'NameScan', docsUrl: 'https://api.namescan.io/doc/index.html', enabled: true },
    { id: 'curp.lookup',            label: 'CURP (MX) – Verificación',   vendor: 'MX-Gob',   docsUrl: 'https://www.gob.mx/curp/',             enabled: true },
    { id: 'rfc_sat.lookup',         label: 'RFC SAT (MX) – Verificación',vendor: 'SAT',      docsUrl: 'https://www.sat.gob.mx/',              enabled: true },
    { id: 'zapsign.doc_signature',  label: 'ZapSign – Estado de firma',  vendor: 'ZapSign',  docsUrl: 'https://docs.zapsign.com.br/',         enabled: true },
  ];

  for (const it of items) {
    const ref = db.collection('validators').doc(it.id);
    batch.set(ref, it, { merge: true });
  }

  await batch.commit();
  console.log(`Seeded ${items.length} validators`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
