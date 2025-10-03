
export {};
throw new Error(
  "[CLIENT-FIRESTORE-BLOCKED] A client bundle imported 'firebase/*' or '@firebase/*'. "+
  "This app forbids client Firestore. Move data access into server API routes and call them via useSecureFetch."
);
