export const SCHOOL_TYPES = [
  'Basic School (Primary & JHS)',
  'Primary School Only',
  'Junior High School (JHS)',
  'Senior High School (SHS)',
  'TVET / Technical & Vocational',
  'Nursery / Preschool / Kindergarten',
  'International / Private School',
] as const;

export type SchoolType = (typeof SCHOOL_TYPES)[number];

type ClassPreset = {
  name: string;
  code: string;
  sections: string[];
};

type SchoolTypeConfig = {
  level: string;
  classes: ClassPreset[];
};

const BASIC_CLASSES: ClassPreset[] = [
  { name: 'Primary 1', code: 'P1', sections: ['A'] },
  { name: 'Primary 2', code: 'P2', sections: ['A'] },
  { name: 'Primary 3', code: 'P3', sections: ['A'] },
  { name: 'Primary 4', code: 'P4', sections: ['A'] },
  { name: 'Primary 5', code: 'P5', sections: ['A'] },
  { name: 'Primary 6', code: 'P6', sections: ['A'] },
  { name: 'JHS 1', code: 'JHS1', sections: ['A'] },
  { name: 'JHS 2', code: 'JHS2', sections: ['A'] },
  { name: 'JHS 3', code: 'JHS3', sections: ['A'] },
];

export const SCHOOL_TYPE_CONFIG: Record<SchoolType, SchoolTypeConfig> = {
  'Basic School (Primary & JHS)': {
    level: 'Basic School',
    classes: BASIC_CLASSES,
  },
  'Primary School Only': {
    level: 'Basic School',
    classes: BASIC_CLASSES.slice(0, 6),
  },
  'Junior High School (JHS)': {
    level: 'Basic School',
    classes: BASIC_CLASSES.slice(6),
  },
  'Senior High School (SHS)': {
    level: 'Secondary School',
    classes: [
      { name: 'SHS 1', code: 'SHS1', sections: ['A'] },
      { name: 'SHS 2', code: 'SHS2', sections: ['A'] },
      { name: 'SHS 3', code: 'SHS3', sections: ['A'] },
    ],
  },
  'TVET / Technical & Vocational': {
    level: 'Tertiary / Vocational',
    classes: [
      { name: 'Year 1', code: 'Y1', sections: ['A'] },
      { name: 'Year 2', code: 'Y2', sections: ['A'] },
      { name: 'Year 3', code: 'Y3', sections: ['A'] },
    ],
  },
  'Nursery / Preschool / Kindergarten': {
    level: 'Pre-School / Kindergarten',
    classes: [
      { name: 'Nursery 1', code: 'NUR1', sections: ['A'] },
      { name: 'Nursery 2', code: 'NUR2', sections: ['A'] },
      { name: 'KG 1', code: 'KG1', sections: ['A'] },
      { name: 'KG 2', code: 'KG2', sections: ['A'] },
    ],
  },
  'International / Private School': {
    level: 'Basic School',
    classes: BASIC_CLASSES,
  },
};
