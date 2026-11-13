import { Order, OrderStatis } from "./order";
import { Product, ProductsStat } from "./product";
import { Table } from "./table";

/** REACT APP STORE */
export interface AppRootState {
  dashboardPage: DashboardPageState;
  menuPage: MenuPageState;
  ordersPage: OrdersPageState;
  tablesPage: TablesPageState;
}

/** DashboardPage */
export interface DashboardPageState {
  orderStatis: OrderStatis | null;
  tableStatus: Table[];
  productStatus: ProductsStat[];
}

/** MenuPage */
export interface MenuPageState {
  products: Product[];
}

/** OrdersPage */
export interface OrdersPageState {
  orders: Order[];
}

/** TablePage **/
export interface TablesPageState {
  tables: Table[];
}
