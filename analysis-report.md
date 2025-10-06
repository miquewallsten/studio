# Repository Analysis
_Scanned from:_ `/home/user/studio`

## Overview

- Files scanned: **172**
- API routes: **30**
- Pages: **23**
- Components: **73**
- Client Firestore usage (to migrate off in client): **24**
- Server firebase-admin usage: **20**

## API Routes (src/app/api/**/route.*)

- src/app/api/_diag/client-fb-imports/route.ts
- src/app/api/_health/route.ts
- src/app/api/_instance/route.ts
- src/app/api/admin/debug-pem/route.ts
- src/app/api/admin/email-templates/[id]/route.ts
- src/app/api/admin/email-templates/route.ts
- src/app/api/admin/health/route.ts
- src/app/api/admin/teams/route.ts
- src/app/api/ai/echo/route.ts
- src/app/api/ai/health/route.ts
- src/app/api/auth/impersonate/route.ts
- src/app/api/auth/stop-impersonating/route.ts
- src/app/api/client/tickets/create/route.ts
- src/app/api/client/tickets/route.ts
- src/app/api/end-user/tickets/route.ts
- src/app/api/fields/[id]/route.ts
- src/app/api/fields/route.ts
- src/app/api/forms/[id]/route.ts
- src/app/api/forms/route.ts
- src/app/api/send-email/route.ts
- src/app/api/tenants/[id]/resend-invite/route.ts
- src/app/api/tenants/[id]/route.ts
- src/app/api/tenants/route.ts
- src/app/api/tickets/[id]/route.ts
- src/app/api/tickets/route.ts
- src/app/api/user/preferences/route.ts
- src/app/api/users/[uid]/role/route.ts
- src/app/api/users/[uid]/route.ts
- src/app/api/users/invite/route.ts
- src/app/api/users/route.ts

## Pages (src/app/**/page.*)

- src/app/client/dashboard/page.tsx
- src/app/client/login/page.tsx
- src/app/client/request/new/page.tsx
- src/app/client/ticket/[id]/page.tsx
- src/app/dashboard/admin/email-templates/page.tsx
- src/app/dashboard/admin/settings/page.tsx
- src/app/dashboard/admin/teams/page.tsx
- src/app/dashboard/admin/tenants/[id]/page.tsx
- src/app/dashboard/admin/tenants/page.tsx
- src/app/dashboard/admin/users/page.tsx
- src/app/dashboard/fields/page.tsx
- src/app/dashboard/forms/page.tsx
- src/app/dashboard/page.tsx
- src/app/dashboard/tenant/page.tsx
- src/app/dashboard/tenant/users/page.tsx
- src/app/dashboard/testing/impersonate/page.tsx
- src/app/dashboard/tickets/[id]/page.tsx
- src/app/dashboard/tickets/new/page.tsx
- src/app/dashboard/tickets/page.tsx
- src/app/dashboard/workflow/page.tsx
- src/app/form/[ticketId]/page.tsx
- src/app/form/submitted/page.tsx
- src/app/onboard/page.tsx

## Components (src/components/**)

- src/components/change-role-dialog.tsx
- src/components/client-user-nav.tsx
- src/components/dashboard/assistant-widget.tsx
- src/components/dashboard/customer-experience-widget.tsx
- src/components/dashboard/expiring-invites-widget.tsx
- src/components/dashboard/quick-actions-widget.tsx
- src/components/dashboard/widget-library.tsx
- src/components/email-template-editor.tsx
- src/components/field-editor.tsx
- src/components/field-library.tsx
- src/components/form-editor.tsx
- src/components/icons.tsx
- src/components/inline-tag-editor.tsx
- src/components/invite-user-dialog.tsx
- src/components/new-field-dialog.tsx
- src/components/new-form-dialog.tsx
- src/components/new-tenant-dialog.tsx
- src/components/resend-invite-dialog.tsx
- src/components/sub-fields-editor.tsx
- src/components/support-chat-widget.tsx
- src/components/tenant-invite-user-dialog.tsx
- src/components/tenant-profile-dialog.tsx
- src/components/testing/analyst-portal-widget.tsx
- src/components/testing/assign-ticket-dialog.tsx
- src/components/testing/client-portal-widget.tsx
- src/components/testing/end-user-portal-widget.tsx
- src/components/testing/invitation-inbox-widget.tsx
- src/components/testing/mobile-end-user-portal-widget.tsx
- src/components/testing/workflow-widget.tsx
- src/components/ui/accordion.tsx
- src/components/ui/alert-dialog.tsx
- src/components/ui/alert.tsx
- src/components/ui/avatar.tsx
- src/components/ui/badge.tsx
- src/components/ui/button.tsx
- src/components/ui/calendar.tsx
- src/components/ui/card.tsx
- src/components/ui/carousel.tsx
- src/components/ui/chart.tsx
- src/components/ui/checkbox.tsx
- src/components/ui/collapsible.tsx
- src/components/ui/command.tsx
- src/components/ui/data-table-column-header.tsx
- src/components/ui/data-table-faceted-filter.tsx
- src/components/ui/data-table-pagination.tsx
- src/components/ui/data-table-toolbar.tsx
- src/components/ui/data-table-view-options.tsx
- src/components/ui/data-table.tsx
- src/components/ui/dialog.tsx
- src/components/ui/dropdown-menu.tsx
- src/components/ui/form.tsx
- src/components/ui/input.tsx
- src/components/ui/label.tsx
- src/components/ui/menubar.tsx
- src/components/ui/popover.tsx
- src/components/ui/progress.tsx
- src/components/ui/radio-group.tsx
- src/components/ui/scroll-area.tsx
- src/components/ui/select.tsx
- src/components/ui/separator.tsx
- src/components/ui/sheet.tsx
- src/components/ui/sidebar.tsx
- src/components/ui/skeleton.tsx
- src/components/ui/slider.tsx
- src/components/ui/switch.tsx
- src/components/ui/table.tsx
- src/components/ui/tabs.tsx
- src/components/ui/textarea.tsx
- src/components/ui/toast.tsx
- src/components/ui/toaster.tsx
- src/components/ui/tooltip.tsx
- src/components/user-nav.tsx
- src/components/user-profile-dialog.tsx

## Client Firestore usage (migrate to API)

- src/app/api/admin/email-templates/[id]/route.ts
- src/app/api/admin/email-templates/route.ts
- src/app/api/client/tickets/create/route.ts
- src/app/api/client/tickets/route.ts
- src/app/api/end-user/tickets/route.ts
- src/app/api/fields/[id]/route.ts
- src/app/api/fields/route.ts
- src/app/api/forms/[id]/route.ts
- src/app/api/forms/route.ts
- src/app/api/tenants/[id]/resend-invite/route.ts
- src/app/api/tenants/[id]/route.ts
- src/app/api/tenants/route.ts
- src/app/api/tickets/[id]/route.ts
- src/app/api/tickets/route.ts
- src/app/api/user/preferences/route.ts
- src/app/api/users/[uid]/role/route.ts
- src/app/api/users/[uid]/route.ts
- src/app/api/users/invite/route.ts
- src/app/api/users/route.ts
- src/app/client/dashboard/page.tsx
- src/app/dashboard/forms/page.tsx
- src/app/form/[ticketId]/page.tsx
- src/lib/firebase.ts
- src/lib/firebaseAdmin.ts

## Server firebase-admin usage

- src/app/api/admin/email-templates/[id]/route.ts
- src/app/api/admin/email-templates/route.ts
- src/app/api/client/tickets/create/route.ts
- src/app/api/client/tickets/route.ts
- src/app/api/end-user/tickets/route.ts
- src/app/api/fields/[id]/route.ts
- src/app/api/fields/route.ts
- src/app/api/forms/[id]/route.ts
- src/app/api/forms/route.ts
- src/app/api/tenants/[id]/resend-invite/route.ts
- src/app/api/tenants/[id]/route.ts
- src/app/api/tenants/route.ts
- src/app/api/tickets/[id]/route.ts
- src/app/api/tickets/route.ts
- src/app/api/user/preferences/route.ts
- src/app/api/users/[uid]/role/route.ts
- src/app/api/users/[uid]/route.ts
- src/app/api/users/invite/route.ts
- src/app/api/users/route.ts
- src/lib/firebaseAdmin.ts

## Auth Guards

- src/app/api/_diag/client-fb-imports/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:❌
- src/app/api/admin/email-templates/[id]/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/admin/email-templates/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:❌
- src/app/api/auth/impersonate/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/client/tickets/create/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/client/tickets/route.ts — requireAuth:✅, requireRole:❌, NextRequest import:✅
- src/app/api/end-user/tickets/route.ts — requireAuth:✅, requireRole:❌, NextRequest import:✅
- src/app/api/fields/[id]/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/fields/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/forms/[id]/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/forms/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/send-email/route.ts — requireAuth:✅, requireRole:❌, NextRequest import:❌
- src/app/api/tenants/[id]/resend-invite/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/tenants/[id]/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/tenants/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/tickets/[id]/route.ts — requireAuth:✅, requireRole:❌, NextRequest import:✅
- src/app/api/tickets/route.ts — requireAuth:✅, requireRole:❌, NextRequest import:✅
- src/app/api/user/preferences/route.ts — requireAuth:✅, requireRole:❌, NextRequest import:✅
- src/app/api/users/[uid]/role/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/users/[uid]/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/users/invite/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/app/api/users/route.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/lib/authApi.ts — requireAuth:✅, requireRole:✅, NextRequest import:✅
- src/lib/rbac.ts — requireAuth:❌, requireRole:✅, NextRequest import:❌
- tools/analyze-repo.js — requireAuth:✅, requireRole:❌, NextRequest import:✅

## Cookies / Headers usage

- src/app/api/auth/impersonate/route.ts
- src/app/api/auth/stop-impersonating/route.ts
- src/app/api/client/tickets/create/route.ts
- tools/analyze-repo.js

## ENV Keys Referenced

- `ADMIN_FAKE` × 2
- `AI_ENABLED` × 2
- `AI_MODEL` × 1
- `FIREBASE_CLIENT_EMAIL` × 2
- `FIREBASE_PRIVATE_KEY` × 2
- `FIREBASE_PROJECT_ID` × 2
- `FIREBASE_SERVICE_ACCOUNT_B64` × 3
- `GOOGLE_API_KEY` × 1
- `GOOGLE_APPLICATION_CREDENTIALS` × 2
- `NEXT_PUBLIC_FIREBASE_API_KEY` × 1
- `NEXT_PUBLIC_FIREBASE_APP_ID` × 1
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` × 1
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` × 1
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` × 1
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` × 1
- `NODE_ENV` × 7

## Tickets / Forms / Fields — where mentioned

- src/app/api/client/tickets/create/route.ts — tickets, forms, fields
- src/app/api/client/tickets/route.ts — tickets
- src/app/api/end-user/tickets/route.ts — tickets, fields
- src/app/api/fields/[id]/route.ts — fields
- src/app/api/fields/route.ts — forms, fields
- src/app/api/forms/[id]/route.ts — forms
- src/app/api/forms/route.ts — forms, fields
- src/app/api/tenants/route.ts — tickets
- src/app/api/tickets/[id]/route.ts — tickets
- src/app/api/tickets/route.ts — tickets
- src/app/api/users/route.ts — tickets
- src/app/client/dashboard/page.tsx — tickets
- src/app/client/login/page.tsx — forms
- src/app/client/request/new/page.tsx — tickets, forms
- src/app/client/ticket/[id]/page.tsx — tickets
- src/app/dashboard/admin/tenants/[id]/page.tsx — forms
- src/app/dashboard/admin/tenants/columns.tsx — tickets
- src/app/dashboard/fields/columns.tsx — fields
- src/app/dashboard/fields/page.tsx — forms, fields
- src/app/dashboard/fields/schema.ts — fields
- src/app/dashboard/forms/columns.tsx — forms, fields
- src/app/dashboard/forms/page.tsx — forms, fields
- src/app/dashboard/nav.tsx — tickets, forms, fields
- src/app/dashboard/page.tsx — tickets
- src/app/dashboard/tenant/page.tsx — tickets
- src/app/dashboard/tickets/[id]/page.tsx — tickets, forms, fields
- src/app/dashboard/tickets/columns.tsx — tickets
- src/app/dashboard/tickets/new/page.tsx — tickets, forms
- src/app/dashboard/tickets/page.tsx — tickets
- src/app/dashboard/tickets/schema.ts — tickets
- src/app/dashboard/workflow/page.tsx — tickets
- src/app/form/[ticketId]/page.tsx — tickets, forms, fields
- src/app/onboard/page.tsx — forms
- src/app/page.tsx — forms
- src/client/request/new/page.tsx — tickets, forms
- src/components/dashboard/customer-experience-widget.tsx — tickets
- src/components/dashboard/expiring-invites-widget.tsx — tickets
- src/components/dashboard/quick-actions-widget.tsx — tickets, forms
- src/components/field-editor.tsx — fields
- src/components/field-library.tsx — forms, fields
- src/components/form-editor.tsx — tickets, forms, fields
- src/components/new-field-dialog.tsx — forms, fields
- src/components/new-form-dialog.tsx — forms, fields
- src/components/new-tenant-dialog.tsx — forms
- src/components/sub-fields-editor.tsx — fields
- src/components/tenant-invite-user-dialog.tsx — forms
- src/components/tenant-profile-dialog.tsx — tickets
- src/components/testing/analyst-portal-widget.tsx — tickets
- src/components/testing/assign-ticket-dialog.tsx — tickets
- src/components/testing/client-portal-widget.tsx — tickets, forms
- src/components/testing/end-user-portal-widget.tsx — tickets, forms
- src/components/testing/invitation-inbox-widget.tsx — tickets, forms
- src/components/testing/mobile-end-user-portal-widget.tsx — tickets, forms
- src/components/testing/workflow-widget.tsx — tickets
- src/components/ui/form.tsx — forms
- src/components/user-profile-dialog.tsx — tickets, forms
- src/lib/authApi.ts — fields
- src/lib/firebaseAdmin.ts — fields
- tools/analyze-repo.js — tickets, forms, fields

## Potential Problems / TODOs

_none_