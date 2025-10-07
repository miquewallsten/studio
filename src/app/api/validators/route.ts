import { NextResponse } from 'next/server';

export async function GET() {
  // Keep minimal metadata for UI pickers; real configs can live in Firestore if needed.
  const validators = [
    { id: 'namescan.pep_screening', label: 'NameScan – PEP/Watchlists' },
    { id: 'curp.lookup',            label: 'CURP (MX) – Verificación' },
    { id: 'rfc_sat.lookup',         label: 'RFC SAT (MX) – Verificación' },
    { id: 'zapsign.doc_signature',  label: 'ZapSign – Estado de firma' },
  ];
  return NextResponse.json({ validators });
}
