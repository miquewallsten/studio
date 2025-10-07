import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

function db() {
  if (!getApps().length) initializeApp();
  return getFirestore();
}

export type ValidationJob = {
  ticketId: string;
  fieldId: string;
  fieldLabel?: string;
  validatorId: string;
  level: 'hard'|'soft';
  status: 'pending'|'success'|'fail'|'error';
  summary: string;
  evidence?: Record<string, any>;
  links?: { label: string; url: string }[];
  warnings?: string[];
  errors?: string[];
  ranBy?: { uid?: string; role?: string };
  startedAt: FirebaseFirestore.Timestamp;
  finishedAt: FirebaseFirestore.Timestamp;
};

export async function addValidationJob(job: Omit<ValidationJob, 'startedAt'|'finishedAt'>) {
  const d = db();
  const now = new Date();
  const ref = d.collection('tickets').doc(job.ticketId)
    .collection('validations').doc();
  await ref.set({
    ...job,
    startedAt: now,
    finishedAt: now,
  });
  return { id: ref.id };
}

export async function listValidationJobs(ticketId: string, limit = 50) {
  const d = db();
  const snap = await d.collection('tickets').doc(ticketId)
    .collection('validations').orderBy('finishedAt','desc').limit(limit).get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
