export interface CargoType {
  id: string;
  name: string;
  description: string;
  restrictions?: string[];
  handling_requirements?: string[];
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface CargoDetails {
  type: CargoType;
  dimensions?: Dimensions;
  value?: number;
  currency?: string;
  dangerous_goods?: boolean;
  temperature_controlled?: boolean;
  fragile?: boolean;
  description?: string;
}

export interface Insurance {
  required: boolean;
  coverage_amount?: number;
  premium?: number;
  provider?: string;
}

export interface CustomsInfo {
  commodity_code: string;
  description: string;
  value: number;
  currency: string;
  country_of_origin: string;
  requires_permit?: boolean;
}

export const cargoTypes: CargoType[] = [
  {
    id: 'general',
    name: 'General Cargo',
    description: 'Standard commercial goods',
    handling_requirements: ['Standard handling']
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Electronic devices and components',
    handling_requirements: ['Anti-static handling', 'Moisture protection']
  },
  {
    id: 'pharmaceuticals',
    name: 'Pharmaceuticals',
    description: 'Medical drugs and supplies',
    restrictions: ['Temperature controlled', 'Chain of custody required'],
    handling_requirements: ['Temperature monitoring', 'Secure handling']
  },
  {
    id: 'perishables',
    name: 'Perishables',
    description: 'Fresh food and flowers',
    restrictions: ['Time sensitive', 'Temperature controlled'],
    handling_requirements: ['Cold chain', 'Quick processing']
  },
  {
    id: 'textiles',
    name: 'Textiles',
    description: 'Clothing and fabric materials',
    handling_requirements: ['Moisture protection']
  },
  {
    id: 'automotive',
    name: 'Automotive Parts',
    description: 'Vehicle parts and accessories',
    handling_requirements: ['Heavy lifting equipment']
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Important papers and certificates',
    handling_requirements: ['Secure handling', 'Waterproof packaging']
  },
  {
    id: 'machinery',
    name: 'Machinery',
    description: 'Industrial equipment and tools',
    restrictions: ['Weight restrictions apply'],
    handling_requirements: ['Heavy lifting equipment', 'Secure fastening']
  }
];