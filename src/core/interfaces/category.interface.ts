export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  active?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  active?: boolean;
  sortOrder?: number;
}

export interface CategoryResponseDto {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryFilters {
  active?: boolean;
  name?: string;
}
