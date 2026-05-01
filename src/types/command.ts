export type DbOrderCommand = {
  id: number;
  order_id: number;
  command_code: string;
  command_level: number | null;
  is_disabled: boolean;
};

export type DbCommand = {
  ingredient_name: string;
  command_code: string;
};
