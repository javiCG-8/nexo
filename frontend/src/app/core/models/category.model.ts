export interface Category {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface CategoryListResponse {
  items: Category[];
}
