export type ValidatorId =
  | 'namescan.pep_screening'
  | 'curp.lookup'
  | 'rfc_sat.lookup'
  | 'zapsign.doc_signature';

export type ValidationLevel = 'hard' | 'soft';
export type ValidationStatus = 'pending' | 'success' | 'fail' | 'error';

export type ValidatorInput = {
  fieldId: string;
  fieldLabel: string;
  value: unknown;
  // free-form extras (e.g., {country:'MX'} or document meta)
  context?: Record<string, unknown>;
};

export type ValidatorResult = {
  status: ValidationStatus;
  summary: string;                // short human summary
  evidence?: Record<string, any>; // raw vendor data minimally
  links?: { label: string; url: string }[]; // vendor URLs
  warnings?: string[];
  errors?: string[];
};

export type ValidatorFn = (input: ValidatorInput) => Promise<ValidatorResult>;

export type FieldValidationRule = {
  validatorId: ValidatorId;
  level: ValidationLevel;
  // optional field->param mapping, e.g. { "value" : "$self", "country": "$ticket.country" }
  mapping?: Record<string, string>;
};

export type FieldDefinition = {
  id: string;               // Firestore doc id in `fields`
  label: string;
  type: 'text'|'number'|'date'|'select'|'composite';
  required?: boolean;
  compositeOf?: string[];   // for composite fields
  validations?: FieldValidationRule[];
  ui?: Record<string, unknown>;
};
