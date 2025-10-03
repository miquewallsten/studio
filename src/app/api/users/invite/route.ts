
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { NextRequest } from 'next/server';
import { apiSafe } from '@/lib/api-safe';
import { requireAuth } from '@/lib/authApi';
import { checkRateLimit } from '@/lib/rateLimit';
import { requireRole, Role } from '@/lib/rbac';
import { logger } from '@/lib/logger';

const VALID_ROLES: Role[] = ['Super Admin', 'Admin', 'Manager', 'Analyst', 'View Only', 'Tenant Admin', 'Tenant User', 'End User'];

export async function POST(request: NextRequest) {
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  
  return apiSafe(async () => {
    checkRateLimit(request);
    const decodedToken = await requireAuth(request);
    
    const { email, role, tenantId } = await request.json();

    if (!email) {
      throw new Error('Email is required.');
    }

    const assignedRole: Role = role || (tenantId ? 'End User' : 'Unassigned');
    
    if (!VALID_ROLES.includes(assignedRole)) {
      throw new Error('Invalid role specified.');
    }

    if (tenantId) {
        // Tenant Admins can invite users to their own tenant
        if (decodedToken.role === 'Tenant Admin') {
            if (decodedToken.tenantId !== tenantId) {
                throw new Error('Forbidden. You can only invite users to your own tenant.');
            }
        // Super Admins can invite to any tenant
        } else {
            requireRole(decodedToken.role, 'Super Admin');
        }
    } else {
        // Only Super Admins can invite internal staff (no tenantId)
        requireRole(decodedToken.role, 'Super Admin');
    }

    let userRecord;
    try {
        userRecord = await adminAuth.createUser({
          email: email,
          emailVerified: false,
        });
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            userRecord = await adminAuth.getUserByEmail(email);
        } else {
            throw error;
        }
    }
    
    const customClaims: {[key: string]: string} = { role: assignedRole };
    const userProfile: {[key: string]: any} = {
        email: userRecord.email,
        role: assignedRole,
    };

    if (tenantId) {
        customClaims.tenantId = tenantId;
        userProfile.tenantId = tenantId;
    }

    await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);
    
    const userRef = adminDb.collection('users').doc(userRecord.uid);
    await userRef.set(userProfile, { merge: true });

    logger.info('User invited', { inviterUid: decodedToken.uid, newUserEmail: email, role: assignedRole, tenantId });

    return { uid: userRecord.uid, email: userRecord.email, claims: customClaims };
  });
}
