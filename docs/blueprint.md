# **App Name**: TenantCheck

## Core Features:

- Client Portal: Secure portal for clients to manage their background check requests, review past reports, and manage billing. Database driven portal content. Content is based on User and Roles. Clients must not be able to see other clients' info. Client Portal might be easyier if Dynamic and not a Portal but a Dashboard.
- Ticket Creation: Clients can create tickets by submitting information about the person or company to be investigated and selecting the type of report needed. All ticket data is database driven.
- Automated Form Dispatch: App automatically dispatches a personalized form to the contact for them to provide necessary information and documents based on the report type requested. All forms and fields are database driven. Generative AI "tool" will make a determination about including specialized compliance questions in each generated form, in order to assist report creation and to increase quality.
- Progress Saving: End-users can save their progress on the form and complete it at a later time. Database driven.
- Analyst Assignment and Validation: Analysts are assigned to tickets, where they can validate submitted information, work on the report, and attach it to the ticket. All assignments are database driven. Workflow ensures proper assignment and validation.
- Report Repository: The platform serves as a cloud-based repository where customers can download reports and certificates. Database driven file storage and access.
- User and Role Management: The app will include an 'admin' panel for the purposes of defining the various system roles (client, analyst, manager, etc.), to allow granular control of resource access.
- Authentication, Routing, and Data Segmentation: Authentication, Routing, and Data Segmentation are in the highest priority and fully database driven.
- User Roles: Users.. Super Admin for back office.. Tenants or Clients to request tickets,, End users who will fill out the forms, Analyst manager who assigns tickets to Analysts, Analysts and View Only users for Reporting Purposes.
- Dynamic Fields and Forms: Fields and Forms are the ones that will be sent o the End users to fill. make sure dynamic fields, composit fields can be created in te fields library and can be used by multiple forms.. NOTE.. The forms corresponds to the Report Type the client requested.
- Firebase Backend: Firebase project backend with Authentication and FireStore Database is a must. This must be set up at the beggining so that all tables and users are created there from the beggining.
- Single Instance: Single instance, No mock data NEVER.

## Style Guidelines:

- Primary color: Deep blue (#30475E) to convey trust and professionalism.
- Background color: Light gray (#E8E8E8) to ensure a clean and readable interface.
- Accent color: Soft orange (#F05454) to highlight key actions and calls to action.
- Headline font: 'Poppins', a geometric sans-serif font for headlines and shorter text.
- Body font: 'PT Sans', a humanist sans-serif font to use in the body, paired with the Poppins headline font.
- Use simple, professional icons to represent different report types and actions.
- Implement a clean, intuitive layout, inspired by https://grispi.com/en/, focusing on ease of navigation and clear presentation of information.