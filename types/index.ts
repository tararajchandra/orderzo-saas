export interface MenuItem {
    id: number;
    name: string;
    description: string;
    category_id: number;
    category_name?: string;
    price: number;
    gst_rate?: number; // GST rate in percentage (e.g., 5, 12, 18)
    image_data?: Buffer;
    image_type?: string;
    image_id?: number;
    image_url?: string; // Base64 encoded image data URL
    available: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface CartItem {
    menuItem: MenuItem;
    quantity: number;
}

export interface Order {
    id?: number;
    user_id?: number;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total_amount: number;
    payment_method: 'cash' | 'card' | 'upi' | 'wallet';
    payment_status?: 'pending' | 'paid' | 'failed';
    order_status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface Invoice {
    id: number;
    order_id: number;
    invoice_number: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    generated_at: Date;
}

export interface User {
    id: number;
    email: string;
    name: string;
    phone?: string;
    address?: string;
    role: 'customer' | 'admin';
    created_at: Date;
}
