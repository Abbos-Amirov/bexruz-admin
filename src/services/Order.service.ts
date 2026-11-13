import axios from "axios";
import { serverApi } from "../lib/config";
import {
  Order,
  OrderInquiry,
  OrderStatis,
  OrderUpdateInput,
} from "../lib/types/order";

class OrderService {
  private readonly path: string;

  constructor() {
    this.path = serverApi;
  }

  public async getOrderStatis(): Promise<OrderStatis> {
    try {
      const url = this.path + "/admin/order/statis";
      const result = await axios.get(url, { withCredentials: true });
      console.log("getOrderStatis: ", result.data);
      return result.data;
    } catch (err) {
      console.log("Error, getOrderStatis:", err);
      throw err;
    }
  }

  public async getCompletedOrdersWithDetails(): Promise<any[]> {
    try {
      const url = `${this.path}/admin/order/all?page=1&limit=50000&status=COMPLETED`;
      const result = await axios.get(url, { withCredentials: true });
      const payload = result.data;
      return (
        Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.orders)
          ? payload.orders
          : Array.isArray(payload?.data?.orders)
          ? payload.data.orders
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.result)
          ? payload.result
          : Array.isArray(payload?.rows)
          ? payload.rows
          : []
      ) as any[];
    } catch (err) {
      console.warn("getCompletedOrdersWithDetails:", err);
      return [];
    }
  }

  public async getOrdersForStats(): Promise<Order[]> {
    try {
      const url = `${this.path}/admin/order/all?page=1&limit=50000&status=COMPLETED&payStatus=PAID`;
      const result = await axios.get(url, { withCredentials: true });
      const payload = result.data;
      return (
        Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.orders)
          ? payload.orders
          : Array.isArray(payload?.data?.orders)
          ? payload.data.orders
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.result)
          ? payload.result
          : Array.isArray(payload?.rows)
          ? payload.rows
          : []
      ) as Order[];
    } catch (err) {
      console.warn("getOrdersForStats:", err);
      return [];
    }
  }

  public async getOrderById(orderId: string): Promise<any> {
    try {
      const url = `${this.path}/admin/order/${orderId}`;
      const result = await axios.get(url, { withCredentials: true });
      return result.data;
    } catch (err) {
      console.warn("getOrderById:", err);
      throw err;
    }
  }

  public async getAllOrders(input: OrderInquiry): Promise<Order[]> {
    try {
      let url = `${this.path}/admin/order/all?page=${input.page}&limit=${input.limit}`;
      if (input.search) url += `&search=${input.search}`;
      if (input.type) url += `&type=${input.type}`;
      if (input.status) url += `&status=${input.status}`;
      if (input.payStatus) url += `&payStatus=${input.payStatus}`;
      if (input.payMeth) url += `&payMeth=${input.payMeth}`;
      const result = await axios.get(url, { withCredentials: true });
      console.log("getAllOrders: ", result);
      return result.data;
    } catch (err) {
      console.log("Error, getOrderStatis:", err);
      throw err;
    }
  }

  public async updateChosenOrder(input: OrderUpdateInput): Promise<Order> {
    try {
      const url = `${this.path}/admin/order/${input.orderId}`;
      const result = await axios.post(url, input, { withCredentials: true });
      console.log("updateChosenOrder: ", result);
      return result.data;
    } catch (err) {
      console.log("Error, updateChosenOrder:", err);
      throw err;
    }
  }

  public async completeTableOrders(tableId: string): Promise<unknown> {
    try {
      const url = `${this.path}/admin/order/table/${tableId}/complete`;
      const result = await axios.post(url, {}, { withCredentials: true });
      console.log("completeTableOrders: ", result);
      return result.data;
    } catch (err) {
      console.log("Error, completeTableOrders:", err);
      throw err;
    }
  }

  /** Buyurtmadan bitta taomni bekor qilish; `quantity` berilmasa taom butunlay olib tashlanadi */
  public async cancelOrderItem(itemId: string, quantity?: number): Promise<unknown> {
    const url = `${this.path}/admin/order/item/${itemId}/cancel`;
    const result = await axios.post(url, quantity ? { quantity } : {}, { withCredentials: true });
    return result.data;
  }

  /** Taomlar bo'yicha sotuv: `from` sanasidan beri har bir taomdan nechta sotilgani */
  public async getProductSales(from: Date): Promise<ProductSale[]> {
    const url = `${this.path}/admin/product/sales?from=${encodeURIComponent(from.toISOString())}`;
    const result = await axios.get(url, { withCredentials: true });
    return Array.isArray(result.data) ? result.data : [];
  }
}

export default OrderService;

export interface ProductSale {
  _id: string;
  productName: string;
  productImages: string[];
  productCollection: string;
  productPrice: number;
  productStatus: string;
  soldQty: number;
  revenue: number;
  orderCount: number;
}
