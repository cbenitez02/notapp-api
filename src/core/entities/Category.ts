export class Category {
  constructor(
    public id: string,
    public name: string,
    public description: string | undefined,
    public color: string | undefined,
    public icon: string | undefined,
    public active: boolean,
    public sortOrder: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validateCategory();
  }

  private validateCategory(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Category ID cannot be empty');
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }

    if (this.name.length > 50) {
      throw new Error('Category name cannot exceed 50 characters');
    }

    if (this.description && this.description.length > 255) {
      throw new Error('Category description cannot exceed 255 characters');
    }

    if (this.color && !this.isValidHexColor(this.color)) {
      throw new Error('Color must be in valid hex format (#RRGGBB)');
    }

    if (this.icon && this.icon.length > 50) {
      throw new Error('Icon name cannot exceed 50 characters');
    }

    if (this.sortOrder < 0) {
      throw new Error('Sort order cannot be negative');
    }
  }

  private isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  public updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
    if (name.length > 50) {
      throw new Error('Category name cannot exceed 50 characters');
    }
    this.name = name.trim();
  }

  public updateDescription(description?: string): void {
    if (description && description.length > 255) {
      throw new Error('Category description cannot exceed 255 characters');
    }
    this.description = description;
  }

  public updateColor(color?: string): void {
    if (color && !this.isValidHexColor(color)) {
      throw new Error('Color must be in valid hex format (#RRGGBB)');
    }
    this.color = color;
  }

  public updateIcon(icon?: string): void {
    if (icon && icon.length > 50) {
      throw new Error('Icon name cannot exceed 50 characters');
    }
    this.icon = icon;
  }

  public updateSortOrder(sortOrder: number): void {
    if (sortOrder < 0) {
      throw new Error('Sort order cannot be negative');
    }
    this.sortOrder = sortOrder;
  }

  public activate(): void {
    this.active = true;
  }

  public deactivate(): void {
    this.active = false;
  }
}
